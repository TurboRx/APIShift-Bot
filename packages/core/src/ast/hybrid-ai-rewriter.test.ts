import { describe, it, expect } from 'vitest';
import { rewriteWithHybridAI } from './hybrid-ai-rewriter.js';

describe('Hybrid AI AST Engine', () => {
  it('performs instant deterministic AST transform without requiring AI by default', async () => {
    const inputCode = `
const payment = await stripe.charges.create({
  amount: 1000,
  card: 'tok_mastercard',
});
`;

    const result = await rewriteWithHybridAI(inputCode, {
      renames: [{ oldName: 'card', newName: 'payment_method' }],
      filename: 'payment.ts',
    });

    expect(result.hasChanges).toBe(true);
    expect(result.usedAIFallback).toBe(false);
    expect(result.code).toContain('payment_method: \'tok_mastercard\'');
  });
});
