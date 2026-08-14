import crypto from 'node:crypto';
import { Octokit } from '@octokit/rest';

export interface GitHubAuthEnv {
  APP_ID?: string;
  APP_PRIVATE_KEY?: string;
  GITHUB_TOKEN?: string;
}

function base64url(buf: Buffer | string): string {
  return (typeof buf === 'string' ? Buffer.from(buf) : buf).toString('base64url');
}

export function normalizePrivateKey(key: string): string {
  let normalized = key.trim().replace(/^["']|["']$/g, '');
  if (normalized.includes('\\n') && !normalized.includes('\n')) {
    normalized = normalized.replace(/\\n/g, '\n');
  }
  return normalized.replace(/\r\n/g, '\n');
}

export function generateAppJWT(appId: string, privateKey: string): string {
  const normalizedKey = normalizePrivateKey(privateKey);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const sig = signer.sign(normalizedKey);
  return `${header}.${payload}.${base64url(sig)}`;
}

export async function getAuthenticatedOctokit(
  env: GitHubAuthEnv,
  owner?: string,
  repo?: string
): Promise<Octokit> {
  if (env.APP_ID && env.APP_PRIVATE_KEY) {
    try {
      const jwt = generateAppJWT(env.APP_ID, env.APP_PRIVATE_KEY);

      if (owner && repo) {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/installation`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'APIShift-Bot',
          },
        });

        if (repoRes.ok) {
          const repoData = (await repoRes.json()) as { id: number };
          const tokenRes = await fetch(
            `https://api.github.com/app/installations/${repoData.id}/access_tokens`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'APIShift-Bot',
              },
            }
          );

          if (tokenRes.ok) {
            const tokenData = (await tokenRes.json()) as { token: string };
            return new Octokit({ auth: tokenData.token });
          }
        }
      }

      // If no specific repo or repo installation lookup failed, try getting first available installation
      const instRes = await fetch('https://api.github.com/app/installations', {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'APIShift-Bot',
        },
      });

      if (instRes.ok) {
        const installations = (await instRes.json()) as Array<{ id: number }>;
        if (installations.length > 0 && installations[0]) {
          const tokenRes = await fetch(
            `https://api.github.com/app/installations/${installations[0].id}/access_tokens`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'APIShift-Bot',
              },
            }
          );
          if (tokenRes.ok) {
            const tokenData = (await tokenRes.json()) as { token: string };
            return new Octokit({ auth: tokenData.token });
          }
        }
      }
    } catch (err) {
      console.warn('GitHub App authentication failed, falling back to GITHUB_TOKEN if available:', err);
    }
  }

  if (env.GITHUB_TOKEN) {
    return new Octokit({ auth: env.GITHUB_TOKEN });
  }

  throw new Error('No GitHub credentials found (APP_ID + APP_PRIVATE_KEY or GITHUB_TOKEN)');
}
