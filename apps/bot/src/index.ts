import { Hono } from 'hono';
import { verify } from '@octokit/webhooks-methods';
import { Octokit } from '@octokit/rest';
import { createRefactoringPR } from './github/pr.js';
import type { RenameRule, EndpointUpdateRule } from '@apishift/core';

export interface Env {
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  DEFAULT_BRANCH?: string;
  APP_ID?: string;
  APP_PRIVATE_KEY?: string;
}

import { cors } from 'hono/cors';
import { getAuthenticatedOctokit } from './github/auth.js';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

import { renderDashboardHTML } from './web/dashboard.js';
import { pollVendorSpecs } from './cron/spec-watcher.js';
import { globalWebhookQueue } from './queue/webhook-queue.js';
import { batchFleetRefactor } from './fleet/fleet-manager.js';
import { rewriteAST, diffSchemas } from '@apishift/core';

// 1. Web Dashboard & Info routes
app.get('/', (c) => c.html(renderDashboardHTML()));
app.get('/dashboard', (c) => c.html(renderDashboardHTML()));

app.get('/health', (c) =>
  c.json({ status: 'online', service: 'APIShift Bot Edge Engine', version: '0.1.0' })
);

// Live AST Refactor API for Playground Workbench
app.post('/api/refactor', async (c) => {
  try {
    const body = await c.req.json();
    const { code = '', renames = [], endpointUpdates = [], filename = 'app.ts' } = body;
    const result = rewriteAST(code, { renames, endpointUpdates, filename });
    return c.json(result);
  } catch (err) {
    return c.json({ error: 'Failed to process AST refactor', details: String(err) }, 400);
  }
});

// Live Schema Differ API
app.post('/api/diff', async (c) => {
  try {
    const body = await c.req.json();
    const { oldSpec, newSpec } = body;
    const result = await diffSchemas(oldSpec, newSpec);
    return c.json(result);
  } catch (err) {
    return c.json({ error: 'Failed to process schema diff', details: String(err) }, 400);
  }
});

// Spec Watcher Cron API
app.get('/api/cron/spec-watcher', async (c) => {
  const results = await pollVendorSpecs();
  return c.json({ status: 'success', timestamp: new Date().toISOString(), results });
});

// Webhook Queue Stats API
app.get('/api/queue/status', (c) => {
  const stats = globalWebhookQueue.getStats();
  const jobs = globalWebhookQueue.getJobs(20);
  return c.json({ status: 'success', stats, recentJobs: jobs });
});

// Enqueue Test Webhook Job API
app.post('/api/queue/enqueue', async (c) => {
  try {
    const body = await c.req.json();
    const event = body.event || 'repository_dispatch';
    const payload = body.payload || { action: 'api_update', repository: 'org/billing-service' };
    const job = globalWebhookQueue.enqueueJob(event, payload);

    // Simulate async processing
    setTimeout(async () => {
      await globalWebhookQueue.processJob(job.id, async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      });
    }, 100);

    return c.json({ status: 'success', message: 'Test webhook job enqueued', job });
  } catch (err) {
    return c.json({ error: 'Failed to enqueue test job', details: String(err) }, 400);
  }
});

// Fleet Batch Refactor API
app.post('/api/fleet/migrate', async (c) => {
  const body = await c.req.json();
  const repoStr = body.repository || 'TurboRx/APIShift-Bot';
  const parts = repoStr.split('/');
  const owner = parts[0] || 'TurboRx';
  const repo = parts[1] || 'APIShift-Bot';

  try {
    const octokit = await getAuthenticatedOctokit(c.env, owner, repo);

    const fleetJob = {
      jobId: 'fleet-' + Date.now(),
      repositories: (Array.isArray(body.repositories) && body.repositories.length > 0)
        ? body.repositories
        : [{ owner, repo, baseBranch: 'main' }],
      renameRules: body.renameRules || [{ oldName: 'card', newName: 'payment_method' }],
      endpointUpdateRules: body.endpointUpdateRules || [{ oldPath: '/v1/charges', newPath: '/v1/payment_intents', oldFunctionName: 'charges', newFunctionName: 'paymentIntents' }],
      summaryText: body.summaryText || 'APIShift Automated AST Fleet Migration'
    };

    const result = await batchFleetRefactor(octokit, fleetJob);
    return c.json({ status: 'success', result });
  } catch (err) {
    return c.json({ error: 'Failed to process fleet migration', details: String(err) }, 500);
  }
});

// 2. GitHub Webhook Handler
app.get('/api/webhook', (c) =>
  c.json({
    status: 'online',
    message:
      'APIShift Webhook Listener is active. Send POST requests with GitHub webhook payloads to trigger migrations.',
  })
);

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
  globalWebhookQueue.enqueueJob(event, payload);

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

    let octokit: Octokit;
    try {
      octokit = await getAuthenticatedOctokit(c.env, owner, repo);
    } catch (authErr) {
      return c.json(
        {
          message: 'Webhook received but GitHub App / Token credentials missing or invalid.',
          error: String(authErr),
          event,
          owner,
          repo,
        },
        202
      );
    }

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

// Fallback route: render Dashboard HTML for any unmatched URL paths
app.notFound((c) => c.html(renderDashboardHTML()));

export default app;
