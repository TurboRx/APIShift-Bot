import { describe, it, expect } from 'vitest';
import { rewriteAST } from './babel-rewriter.js';

describe('Babel AST Rewriter Engine', () => {
  it('renames object properties in API call arguments (e.g. card -> payment_method)', () => {
    const inputCode = `
import stripe from 'stripe';

async function createCharge() {
  const result = await stripe.charges.create({
    amount: 2000,
    currency: 'usd',
    card: 'tok_visa',
  });
  return result;
}
`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method', targetObject: 'charges.create' }],
      filename: 'charge.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.modifiedCount).toBe(1);
    expect(result.code).toContain('payment_method');
    expect(result.code).not.toContain("card: 'tok_visa'");
  });

  it('handles shorthand object properties without syntax errors ({ card } -> { payment_method: card })', () => {
    const inputCode = `
function checkout(card: string) {
  return api.createPayment({
    card,
    amount: 500,
  });
}
`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method' }],
      filename: 'checkout.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('payment_method: card');
    expect(result.code).toContain('amount: 500');
  });

  it('renames member expressions and method calls', () => {
    const inputCode = `
async function run() {
  const charge = await client.charges.create({ id: 1 });
  console.log(charge);
}
`;

    const result = rewriteAST(inputCode, {
      endpointUpdates: [
        {
          oldPath: '/v1/charges',
          newPath: '/v1/payment_intents',
          oldFunctionName: 'charges',
          newFunctionName: 'paymentIntents',
        },
      ],
      filename: 'run.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('client.paymentIntents.create');
  });

  it('updates string literal endpoints in fetch/axios calls', () => {
    const inputCode = `
async function fetchCharges() {
  const response = await fetch('/v1/charges');
  return response.json();
}
`;

    const result = rewriteAST(inputCode, {
      endpointUpdates: [{ oldPath: '/v1/charges', newPath: '/v1/payment_intents' }],
      filename: 'api.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('/v1/payment_intents');
  });

  it('respects targetObject scope filtering and skips non-target object properties', () => {
    const inputCode = `
const config = { card: 'my_card' };
const charge = stripe.charges.create({ card: 'tok_visa' });
`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method', targetObject: 'charges.create' }],
      filename: 'scope.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.modifiedCount).toBe(1);
    expect(result.code).toContain("card: 'my_card'");
    expect(result.code).toContain("payment_method: 'tok_visa'");
  });

  it('updates template literal endpoint strings', () => {
    const inputCode = 'const url = `/v1/charges/${id}`;';

    const result = rewriteAST(inputCode, {
      endpointUpdates: [{ oldPath: '/v1/charges', newPath: '/v1/payment_intents' }],
      filename: 'template.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('/v1/payment_intents/${id}');
  });

  it('renames property signatures in TypeScript interfaces', () => {
    const inputCode = `
interface CreateChargeRequest {
  amount: number;
  card: string;
}
`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method' }],
      filename: 'types.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('payment_method: string;');
  });

  it('renames JSX component attributes matching rename rules', () => {
    const inputCode = `<PaymentForm card="tok_visa" amount={500} />;`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method' }],
      filename: 'component.tsx',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain('payment_method="tok_visa"');
  });

  it('returns unchanged code when no rules match', () => {
    const inputCode = `const sum = (a: number, b: number) => a + b;`;

    const result = rewriteAST(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method' }],
      filename: 'math.ts',
    });

    expect(result.hasChanges).toBe(false);
    expect(result.modifiedCount).toBe(0);
    expect(result.code).toBe(inputCode);
  });
});
