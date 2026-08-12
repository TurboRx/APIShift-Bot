import { describe, it, expect } from 'vitest';
import { diffSchemas, type OpenAPIObject } from './schema-differ.js';

describe('OpenAPI Schema Differ Engine', () => {
  it('detects parameter and request body field renames between OpenAPI specs', async () => {
    const oldSpec: OpenAPIObject = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/v1/charges': {
          post: {
            summary: 'Create charge',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      amount: { type: 'integer' },
                      card: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const newSpec: OpenAPIObject = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '2.0.0' },
      paths: {
        '/v1/charges': {
          post: {
            summary: 'Create charge',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      amount: { type: 'integer' },
                      payment_method: {
                        type: 'string',
                        'x-apishift-renamed-from': 'card',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await diffSchemas(oldSpec, newSpec);

    expect(result.hasBreakingChanges).toBe(true);
    expect(result.renameRules.length).toBeGreaterThan(0);
    const cardRule = result.renameRules.find((r) => r.oldName === 'card');
    expect(cardRule).toBeDefined();
    expect(cardRule?.newName).toBe('payment_method');
  });

  it('detects endpoint path migration from deprecated endpoints', async () => {
    const oldSpec: OpenAPIObject = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/v1/charges': {
          post: { summary: 'Old charges endpoint' },
        },
      },
    };

    const newSpec: OpenAPIObject = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '2.0.0' },
      paths: {
        '/v1/payment_intents': {
          'x-apishift-migrated-from': '/v1/charges',
          post: { summary: 'New payment intents endpoint' },
        },
      },
    };

    const result = await diffSchemas(oldSpec, newSpec);

    expect(result.hasBreakingChanges).toBe(true);
    expect(result.endpointUpdateRules.length).toBe(1);
    expect(result.endpointUpdateRules[0].oldPath).toBe('/v1/charges');
    expect(result.endpointUpdateRules[0].newPath).toBe('/v1/payment_intents');
  });

  it('returns no breaking changes when specs are identical', async () => {
    const spec: OpenAPIObject = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/v1/users': {
          get: { summary: 'List users' },
        },
      },
    };

    const result = await diffSchemas(spec, spec);

    expect(result.hasBreakingChanges).toBe(false);
    expect(result.breakingChanges.length).toBe(0);
  });
});
