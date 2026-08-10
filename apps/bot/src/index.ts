import { Hono } from 'hono';
import { verify } from '@octokit/webhooks-methods';
import { Octokit } from '@octokit/rest';
import { createRefactoringPR } from './github/pr.js';
import type { RenameRule, EndpointUpdateRule } from '@apishift/core';

export interface Env {
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  DEFAULT_BRANCH?: string;
}

const app = new Hono<{ Bindings: Env }>();

// 1. Health check & info routes
app.get('/', (c) => {
  return c.json({
    name: 'APIShift Bot',
    status: 'online',
    version: '0.1.0',
    runtime: 'Cloudflare Worker (Hono Edge)',
    docs: 'https://github.com/TurboRx/APIShift-Bot',
  });
});

app.get('/health', (c) => c.text('OK'));

// 2. GitHub Webhook Handler
app.post('/api/webhook', async (c) => {
  const signature = c.req.header('x-hub-signature-256');
  const event = c.req.header('x-github-event') || 'unknown';
  const rawBody = await c.req.text();

  const webhookSecret = c.env.WEBHOOK_SECRET;

  // Verify HMAC signature if WEBHOOK_SECRET is configured
  if (webhookSecret) {
    if (!signature) {
      return c.json({ error: 'Missing X-Hub-Signature-256 header' }, 401);
    }
    const isValid = await verify(webhookSecret, rawBody, signature);
    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature verification failed' }, 401);
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  console.log(`Received GitHub event: ${event}`);

  // Handle repository_dispatch or check_suite.requested events
  if (
    event === 'check_suite' ||
    event === 'repository_dispatch' ||
    event === 'push' ||
    event === 'workflow_dispatch'
  ) {
    const repository = payload.repository as Record<string, unknown> | undefined;
    if (!repository) {
      return c.json({ message: 'Event ignored: no repository object in payload' }, 200);
    }

    const ownerObj = repository.owner as Record<string, unknown> | undefined;
    const owner = (ownerObj?.login || ownerObj?.name || 'unknown') as string;
    const repo = repository.name as string;
    const baseBranch = (repository.default_branch || c.env.DEFAULT_BRANCH || 'main') as string;

    const githubToken = c.env.GITHUB_TOKEN;
    if (!githubToken) {
      return c.json(
        {
          message: 'Webhook received but GITHUB_TOKEN secret is missing. Skipping PR creation.',
          event,
          owner,
          repo,
        },
        202
      );
    }

    const octokit = new Octokit({ auth: githubToken });

    const clientPayload = payload.client_payload as Record<string, unknown> | undefined;

    // Extract rename rules from payload
    const renameRules: RenameRule[] = (clientPayload?.renameRules as RenameRule[]) ||
      (payload.renameRules as RenameRule[]) || [
        { oldName: 'card', newName: 'payment_method', targetObject: 'charges.create' },
      ];

    const endpointUpdateRules: EndpointUpdateRule[] =
      (clientPayload?.endpointUpdateRules as EndpointUpdateRule[]) ||
        (payload.endpointUpdateRules as EndpointUpdateRule[]) || [
          {
            oldPath: '/v1/charges',
            newPath: '/v1/payment_intents',
            oldFunctionName: 'charges',
            newFunctionName: 'paymentIntents',
          },
        ];

    const targetFiles: string[] = (clientPayload?.targetFiles as string[]) ||
      (payload.targetFiles as string[]) || ['src/index.ts', 'src/api.ts'];

    try {
      const prResult = await createRefactoringPR({
        octokit,
        owner,
        repo,
        baseBranch,
        filePaths: targetFiles,
        renameRules,
        endpointUpdateRules,
        summaryText: `Auto-refactor triggered by GitHub event '${event}'`,
      });

      if (prResult) {
        return c.json(
          {
            status: 'success',
            message: 'Created automated refactoring Pull Request',
            prUrl: prResult.prUrl,
            prNumber: prResult.prNumber,
            branchName: prResult.branchName,
            filesModified: prResult.filesModified,
          },
          201
        );
      } else {
        return c.json(
          {
            status: 'no_changes',
            message: 'Analyzed target files. No code modifications were required.',
          },
          200
        );
      }
    } catch (err) {
      console.error('Error creating refactoring PR:', err);
      return c.json({ error: 'Failed to process refactoring PR', details: String(err) }, 500);
    }
  }

  return c.json({ message: `Webhook event '${event}' acknowledged.` }, 200);
});

export default app;
