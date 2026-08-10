import { rewriteAST } from './babel-rewriter.js';
import type { ASTTransformOptions, ASTTransformResult } from '../types/index.js';

export interface HybridAIOptions extends ASTTransformOptions {
  enableAIFallback?: boolean;
  aiProvider?: 'openai' | 'anthropic' | 'gemini';
  apiKey?: string;
  model?: string;
}

export interface HybridAIResult extends ASTTransformResult {
  usedAIFallback: boolean;
  aiProviderUsed?: string;
}

/**
 * Hybrid Auto-Migration Engine: Combines ultra-fast deterministic AST transforms
 * with optional AI LLM fallback for ambiguous or complex code refactoring scenarios.
 */
export async function rewriteWithHybridAI(
  code: string,
  options: HybridAIOptions = {}
): Promise<HybridAIResult> {
  // Step 1: Run fast deterministic Babel AST transformation
  const astResult = rewriteAST(code, options);

  // If deterministic AST successfully transformed the code or AI fallback is disabled, return directly
  if (astResult.hasChanges || !options.enableAIFallback || !options.apiKey) {
    return {
      ...astResult,
      usedAIFallback: false,
    };
  }

  // Step 2: Hybrid AI Fallback (for complex non-standard refactorings)
  try {
    const provider = options.aiProvider || 'openai';
    const refactoredCode = await invokeAIProvider(code, options, provider);

    return {
      code: refactoredCode || code,
      hasChanges: Boolean(refactoredCode && refactoredCode !== code),
      modifiedCount: astResult.modifiedCount + 1,
      appliedRules: [...astResult.appliedRules, `HybridAI:${provider}`],
      usedAIFallback: true,
      aiProviderUsed: provider,
    };
  } catch (err) {
    console.warn(`[APIShift Engine] Hybrid AI fallback warning: ${String(err)}`);
    return {
      ...astResult,
      usedAIFallback: false,
    };
  }
}

/**
 * Interface to call external AI provider for complex code adaptation
 */
async function invokeAIProvider(
  code: string,
  options: HybridAIOptions,
  provider: string
): Promise<string> {
  const prompt = `Refactor the following TypeScript/JavaScript code to match the updated API schema rules:\nRules: ${JSON.stringify(options.renames || [])}\nCode:\n${code}`;

  if (provider === 'openai' && options.apiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert TypeScript refactoring assistant. Return ONLY the transformed code.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
      }),
    });

    if (res.ok) {
      const data: any = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content
          .replace(/^```[a-z]*\n/i, '')
          .replace(/\n```$/i, '')
          .trim();
      }
    }
  }

  return code;
}
