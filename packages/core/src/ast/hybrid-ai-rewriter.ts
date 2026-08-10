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
              'You are an expert TypeScript refactoring assistant. Return ONLY the transformed code without explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return stripMarkdownCodeFences(content);
      }
    }
  }

  if (provider === 'anthropic' && options.apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': options.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      const content = data.content?.[0]?.text;
      if (content) {
        return stripMarkdownCodeFences(content);
      }
    }
  }

  if (provider === 'gemini' && options.apiKey) {
    const model = options.model || 'gemini-1.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        return stripMarkdownCodeFences(content);
      }
    }
  }

  return code;
}

function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/^```[a-z]*\n/im, '')
    .replace(/\n```$/im, '')
    .replace(/```/g, '')
    .trim();
}
