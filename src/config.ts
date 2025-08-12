// Fill these in for your environment
export const CONFIG = {
  // Your GitHub OAuth or GitHub App client id
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liWBeyf4KdFdi6ZJ',
  // Your Pages origin. Example: https://username.github.io/repo
  APP_ORIGIN: window.location.origin,
  // Redirect URI registered with GitHub OAuth. Must match exactly.
  REDIRECT_URI: (import.meta.env.VITE_REDIRECT_URI as string) || window.location.origin + '/auth/callback',
  // Repo coordinates
  REPO_OWNER: import.meta.env.VITE_REPO_OWNER || 'kd7jhd',
  REPO_NAME: import.meta.env.VITE_REPO_NAME || 'https://github.com/KD7JHD/SPA-Infinite-Canvas.git',
  DEFAULT_BRANCH: import.meta.env.VITE_DEFAULT_BRANCH || 'DEV',
  // n8n webhook URL
  N8N_WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://kd7jhd.app.n8n.cloud/webhook/dynamic-form',
}