import { Octokit } from 'octokit'
import { CONFIG } from '../config'
import { createPkce, popVerifier } from './pkce'

const AUTH_URL = 'https://github.com/login/oauth/authorize'
const TOKEN_URL = 'https://github.com/login/oauth/access_token'

export async function beginOAuth() {
  const { challenge } = await createPkce()
  const url = new URL(AUTH_URL)
  url.searchParams.set('client_id', CONFIG.GITHUB_CLIENT_ID)
  url.searchParams.set('redirect_uri', CONFIG.REDIRECT_URI)
  url.searchParams.set('scope', 'public_repo repo')
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', crypto.randomUUID())
  window.location.assign(url.toString())
}

export async function finishOAuth(code: string): Promise<string> {
  const verifier = popVerifier()
  const body = new URLSearchParams()
  body.set('client_id', CONFIG.GITHUB_CLIENT_ID)
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', CONFIG.REDIRECT_URI)
  body.set('code_verifier', verifier)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const json = await res.json()
  if (!json.access_token) throw new Error('No access_token in response')
  return json.access_token as string
}

export function octokit(token: string) {
  return new Octokit({ auth: token })
}

export async function getProfile(token: string) {
  const ok = octokit(token)
  const { data } = await ok.request('GET /user')
  return data
}

export async function ensureBranch(token: string, ref: string) {
  const ok = octokit(token)
  const { data: repo } = await ok.request('GET /repos/{owner}/{repo}', {
    owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME,
  })
  const baseRef = `heads/${CONFIG.DEFAULT_BRANCH}`
  const { data: base } = await ok.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
    owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME, ref: baseRef,
  })
  try {
    await ok.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME, ref: `heads/${ref}`,
    })
  } catch {
    await ok.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME,
      ref: `refs/heads/${ref}`,
      sha: base.object.sha as string,
    })
  }
}

export async function upsertFile(token: string, branch: string, path: string, content: string, message: string) {
  const ok = octokit(token)
  // Find current SHA if file exists
  let sha: string | undefined
  try {
    const existing = await ok.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME, path, ref: branch,
    })
    if (Array.isArray(existing.data)) throw new Error('Path is a directory')
    sha = (existing.data as any).sha
  } catch {}

  await ok.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME, path,
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
    sha,
  })
}

export async function openPR(token: string, branch: string, title: string) {
  const ok = octokit(token)
  const { data } = await ok.request('POST /repos/{owner}/{repo}/pulls', {
    owner: CONFIG.REPO_OWNER, repo: CONFIG.REPO_NAME,
    title,
    head: branch,
    base: CONFIG.DEFAULT_BRANCH,
  })
  return data.html_url
}