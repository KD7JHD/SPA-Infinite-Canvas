// PKCE helpers using Web Crypto
function base64UrlEncode(buf: ArrayBuffer) {
  let str = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function createPkce() {
  const verifierBytes = new Uint8Array(32)
  crypto.getRandomValues(verifierBytes)
  const verifier = base64UrlEncode(verifierBytes)
  const enc = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  const challenge = base64UrlEncode(digest)
  sessionStorage.setItem('pkce_verifier', verifier)
  return { verifier, challenge }
}

export function popVerifier() {
  const v = sessionStorage.getItem('pkce_verifier')
  if (!v) throw new Error('missing pkce verifier')
  sessionStorage.removeItem('pkce_verifier')
  return v
}