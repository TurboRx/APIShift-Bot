import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generatorModule from '@babel/generator';
import * as t from '@babel/types';
import type { ASTTransformOptions, ASTTransformResult } from '../types/index.js';

// ESM Interop handling for Babel traverse and generator
const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default || traverseModule;
const generate =
  (generatorModule as unknown as { default?: typeof generatorModule }).default || generatorModule;

type TraversePath = {
  node: unknown;
  parentPath?: TraversePath;
  isCallExpression: () => boolean;
};

/**
 * Deterministic AST Rewriter engine using Babel parser, traverse, and generator.
 * Zero AI token cost, 100% deterministic AST transforms.
 */
export function rewriteAST(code: string, options: ASTTransformOptions = {}): ASTTransformResult {
  const { renames = [], endpointUpdates = [], filename = 'file.ts' } = options;

  if (!code || (renames.length === 0 && endpointUpdates.length === 0)) {
    return {
      code,
      hasChanges: false,
      modifiedCount: 0,
      appliedRules: [],
    };
  }

  // Determine if code is TS / JSX
  const isTS = filename.endsWith('.ts') || filename.endsWith('.tsx');
  const isJSX = filename.endsWith('.jsx') || filename.endsWith('.tsx') || code.includes('<');

  const plugins: Array<
    | 'asyncGenerators'
    | 'classProperties'
    | 'decorators-legacy'
    | 'dynamicImport'
    | 'objectRestSpread'
    | 'typescript'
    | 'jsx'
  > = [
    'asyncGenerators',
    'classProperties',
    'decorators-legacy',
    'dynamicImport',
    'objectRestSpread',
  ];

  if (isTS) plugins.push('typescript');
  if (isJSX) plugins.push('jsx');

  const ast = parse(code, {
    sourceType: 'module',
    plugins,
    allowReturnOutsideFunction: true,
  });

  let modifiedCount = 0;
  const appliedRulesSet = new Set<string>();

  traverse(ast, {
    // 1. Rewrite Object Properties (e.g., { card: token } -> { payment_method: token })
    ObjectProperty(path: TraversePath) {
      const node = path.node as t.ObjectProperty;
      const keyName = t.isIdentifier(node.key)
        ? node.key.name
        : t.isStringLiteral(node.key)
          ? node.key.value
          : null;

      if (!keyName) return;

      for (const rule of renames) {
        if (keyName === rule.oldName) {
          // Check target object scope if specified
          if (rule.targetObject && !isWithinTargetCall(path, rule.targetObject)) {
            continue;
          }

          // Transform property key
          if (t.isIdentifier(node.key)) {
            node.key.name = rule.newName;
          } else if (t.isStringLiteral(node.key)) {
            node.key.value = rule.newName;
          }

          // Handle shorthand property: { card } -> { payment_method: card }
          if (node.shorthand) {
            node.shorthand = false;
            node.value = t.identifier(rule.oldName);
          }

          modifiedCount++;
          appliedRulesSet.add(`PropertyRename:${rule.oldName}->${rule.newName}`);
        }
      }
    },

    // 2. Rewrite Member Expressions & Function Calls (e.g. stripe.charges.create -> stripe.paymentIntents.create)
    MemberExpression(path: TraversePath) {
      const node = path.node as t.MemberExpression;

      for (const epRule of endpointUpdates) {
        if (epRule.oldFunctionName && epRule.newFunctionName) {
          if (t.isIdentifier(node.property) && node.property.name === epRule.oldFunctionName) {
            node.property.name = epRule.newFunctionName;
            modifiedCount++;
            appliedRulesSet.add(
              `FunctionRename:${epRule.oldFunctionName}->${epRule.newFunctionName}`
            );
          }
        }
      }
    },

    // 3. Rewrite String Literals (e.g. fetch('/v1/charges') -> fetch('/v1/payment_intents'))
    StringLiteral(path: TraversePath) {
      const node = path.node as t.StringLiteral;

      for (const epRule of endpointUpdates) {
        if (epRule.oldPath && epRule.newPath) {
          if (node.value === epRule.oldPath || node.value.includes(epRule.oldPath)) {
            node.value = node.value.replace(epRule.oldPath, epRule.newPath);
            modifiedCount++;
            appliedRulesSet.add(`EndpointPathUpdate:${epRule.oldPath}->${epRule.newPath}`);
          }
        }
      }
    },

    // 4. Rewrite Template Literals containing endpoint paths
    TemplateLiteral(path: TraversePath) {
      const node = path.node as t.TemplateLiteral;

      for (const epRule of endpointUpdates) {
        if (epRule.oldPath && epRule.newPath) {
          for (const element of node.quasis) {
            if (element.value.raw.includes(epRule.oldPath)) {
              element.value.raw = element.value.raw.replace(epRule.oldPath, epRule.newPath);
              element.value.cooked = element.value.cooked?.replace(epRule.oldPath, epRule.newPath);
              modifiedCount++;
              appliedRulesSet.add(`EndpointPathUpdate:${epRule.oldPath}->${epRule.newPath}`);
            }
          }
        }
      }
    },
  });

  const hasChanges = modifiedCount > 0;
  const output = hasChanges
    ? generate(ast, { retainLines: false, compact: false }, code)
    : { code };

  return {
    code: output.code,
    hasChanges,
    modifiedCount,
    appliedRules: Array.from(appliedRulesSet),
  };
}

/**
 * Helper to check if an AST path is inside a target function/method call
 */
function isWithinTargetCall(path: TraversePath, targetCall: string): boolean {
  let current: TraversePath | undefined = path.parentPath;
  while (current) {
    if (current.isCallExpression()) {
      const callee = (current.node as t.CallExpression).callee;
      const calleeString = generate(callee).code;
      if (calleeString.includes(targetCall)) {
        return true;
      }
    }
    current = current.parentPath;
  }
  return true;
}
