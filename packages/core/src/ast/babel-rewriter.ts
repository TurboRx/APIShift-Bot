import { parse, type ParserPlugin } from '@babel/parser';
import traverseModule, { type NodePath } from '@babel/traverse';
import generatorModule from '@babel/generator';
import * as t from '@babel/types';
import type { ASTTransformOptions, ASTTransformResult } from '../types/index.js';

// ESM Interop handling for Babel traverse and generator
const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default || traverseModule;
const generate =
  (generatorModule as unknown as { default?: typeof generatorModule }).default || generatorModule;

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

  const plugins: ParserPlugin[] = ['decorators-legacy'];

  if (isTS) plugins.push('typescript');
  if (isJSX) plugins.push('jsx');

  const ast = parse(code, {
    sourceType: 'module',
    plugins,
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowSuperOutsideMethod: true,
    errorRecovery: true,
  });

  let modifiedCount = 0;
  const appliedRulesSet = new Set<string>();

  traverse(ast, {
    // 1. Rewrite Object Properties (e.g., { card: token } -> { payment_method: token })
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const node = path.node;
      const keyName = t.isIdentifier(node.key)
        ? node.key.name
        : t.isStringLiteral(node.key)
          ? node.key.value
          : null;

      if (!keyName) return;

      for (const rule of renames) {
        if (keyName === rule.oldName) {
          // Check target object scope if specified
          if (rule.targetObject && !isWithinTargetCall(path, rule.targetObject, endpointUpdates)) {
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
          break;
        }
      }
    },

    // 2. Rewrite Member Expressions & Function Calls (e.g. stripe.charges.create -> stripe.paymentIntents.create)
    MemberExpression(path: NodePath<t.MemberExpression>) {
      const node = path.node;

      for (const epRule of endpointUpdates) {
        if (epRule.oldFunctionName && epRule.newFunctionName) {
          if (t.isIdentifier(node.property) && node.property.name === epRule.oldFunctionName) {
            if (epRule.newFunctionName.includes('.')) {
              const parts = epRule.newFunctionName.split('.');
              if (parts.length === 2 && parts[0] && parts[1]) {
                node.object = t.memberExpression(node.object, t.identifier(parts[0]));
                node.property = t.identifier(parts[1]);
              }
            } else {
              node.property.name = epRule.newFunctionName;
            }
            modifiedCount++;
            appliedRulesSet.add(
              `FunctionRename:${epRule.oldFunctionName}->${epRule.newFunctionName}`
            );
            break;
          }
        }
      }
    },

    // 3. Rewrite Direct CallExpressions (e.g. resend.sendEmail(...) -> resend.emails.send(...))
    CallExpression(path: NodePath<t.CallExpression>) {
      const callee = path.node.callee;

      for (const epRule of endpointUpdates) {
        if (epRule.oldFunctionName && epRule.newFunctionName) {
          if (t.isIdentifier(callee) && callee.name === epRule.oldFunctionName) {
            if (epRule.newFunctionName.includes('.')) {
              const parts = epRule.newFunctionName.split('.');
              if (parts.length === 2 && parts[0] && parts[1]) {
                path.node.callee = t.memberExpression(
                  t.identifier(parts[0]),
                  t.identifier(parts[1])
                );
              }
            } else {
              callee.name = epRule.newFunctionName;
            }
            modifiedCount++;
            appliedRulesSet.add(
              `FunctionRename:${epRule.oldFunctionName}->${epRule.newFunctionName}`
            );
            break;
          }
        }
      }
    },

    // 4. Rewrite String Literals (e.g. fetch('/v1/charges') -> fetch('/v1/payment_intents'))
    StringLiteral(path: NodePath<t.StringLiteral>) {
      const node = path.node;

      for (const epRule of endpointUpdates) {
        if (epRule.oldPath && epRule.newPath) {
          if (node.value === epRule.oldPath || node.value.includes(epRule.oldPath)) {
            node.value = node.value.replaceAll(epRule.oldPath, epRule.newPath);
            modifiedCount++;
            appliedRulesSet.add(`EndpointPathUpdate:${epRule.oldPath}->${epRule.newPath}`);
          }
        }
      }
    },

    // 5. Rewrite Template Literals containing endpoint paths
    TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
      const node = path.node;

      for (const epRule of endpointUpdates) {
        if (epRule.oldPath && epRule.newPath) {
          for (const element of node.quasis) {
            if (element.value.raw.includes(epRule.oldPath)) {
              element.value.raw = element.value.raw.replaceAll(epRule.oldPath, epRule.newPath);
              if (typeof element.value.cooked === 'string') {
                element.value.cooked = element.value.cooked.replaceAll(
                  epRule.oldPath,
                  epRule.newPath
                );
              }
              modifiedCount++;
              appliedRulesSet.add(`EndpointPathUpdate:${epRule.oldPath}->${epRule.newPath}`);
            }
          }
        }
      }
    },

    // 6. Rewrite TypeScript Type Property Signatures (e.g., interface Params { card: string })
    TSPropertySignature(path: NodePath<t.TSPropertySignature>) {
      const node = path.node;
      const keyName = t.isIdentifier(node.key)
        ? node.key.name
        : t.isStringLiteral(node.key)
          ? node.key.value
          : null;

      if (!keyName) return;

      for (const rule of renames) {
        if (keyName === rule.oldName) {
          if (t.isIdentifier(node.key)) {
            node.key.name = rule.newName;
          } else if (t.isStringLiteral(node.key)) {
            node.key.value = rule.newName;
          }
          modifiedCount++;
          appliedRulesSet.add(`TypePropertyRename:${rule.oldName}->${rule.newName}`);
          break;
        }
      }
    },

    // 7. Rewrite JSX Attributes (e.g. <PaymentForm card={tok} /> -> <PaymentForm payment_method={tok} />)
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      const node = path.node;
      if (t.isJSXIdentifier(node.name)) {
        const attrName = node.name.name;
        for (const rule of renames) {
          if (attrName === rule.oldName) {
            node.name.name = rule.newName;
            modifiedCount++;
            appliedRulesSet.add(`JSXAttrRename:${rule.oldName}->${rule.newName}`);
            break;
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
function isWithinTargetCall(
  path: NodePath,
  targetCall: string,
  endpointUpdates: Array<{ oldFunctionName?: string; newFunctionName?: string }> = []
): boolean {
  let current: NodePath | null = path.parentPath;
  while (current) {
    if (current.isCallExpression()) {
      const callee = (current.node as t.CallExpression).callee;
      const calleeString = generate(callee).code;
      if (calleeString.includes(targetCall)) {
        return true;
      }
      // Check matching updated function name if method was already renamed
      for (const ep of endpointUpdates) {
        if (
          ep.oldFunctionName &&
          ep.newFunctionName &&
          (targetCall.includes(ep.oldFunctionName) || targetCall.includes(ep.newFunctionName))
        ) {
          if (
            calleeString.includes(ep.oldFunctionName) ||
            calleeString.includes(ep.newFunctionName)
          ) {
            return true;
          }
        }
      }
    }
    current = current.parentPath;
  }
  return false;
}
