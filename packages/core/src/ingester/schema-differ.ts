import SwaggerParser from '@apidevtools/swagger-parser';
import type {
  BreakingChange,
  EndpointUpdateRule,
  RenameRule,
  SchemaDiffResult,
} from '../types/index.js';

export interface OpenAPIObject {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

/**
 * Compares two OpenAPI specs (Old vs New) and identifies breaking changes,
 * parameter renames, and endpoint updates.
 */
export async function diffSchemas(
  oldSpecInput: OpenAPIObject | string,
  newSpecInput: OpenAPIObject | string
): Promise<SchemaDiffResult> {
  const oldSpec = await parseSpec(oldSpecInput);
  const newSpec = await parseSpec(newSpecInput);

  const breakingChanges: BreakingChange[] = [];
  const renameRules: RenameRule[] = [];
  const endpointUpdateRules: EndpointUpdateRule[] = [];

  const oldPaths = oldSpec.paths || {};
  const newPaths = newSpec.paths || {};

  // 1. Compare Paths & Operations
  for (const [pathKey, oldPathObj] of Object.entries(oldPaths)) {
    const newPathObj = newPaths[pathKey];

    if (!newPathObj) {
      // Check if path was renamed or deprecated
      const matchedNewPath = findRenamedPath(pathKey, oldPathObj, newPaths);
      if (matchedNewPath) {
        const rule: EndpointUpdateRule = {
          oldPath: pathKey,
          newPath: matchedNewPath.newPath,
          oldFunctionName: deriveFunctionName(pathKey),
          newFunctionName: deriveFunctionName(matchedNewPath.newPath),
        };
        endpointUpdateRules.push(rule);
        breakingChanges.push({
          id: `endpoint-renamed-${pathKey}`,
          type: 'ENDPOINT_RENAMED',
          path: pathKey,
          description: `Endpoint path changed from '${pathKey}' to '${matchedNewPath.newPath}'`,
          endpointUpdateRule: rule,
        });
      } else {
        breakingChanges.push({
          id: `endpoint-deprecated-${pathKey}`,
          type: 'ENDPOINT_DEPRECATED',
          path: pathKey,
          description: `Endpoint '${pathKey}' was removed or deprecated.`,
        });
      }
      continue;
    }

    // Inspect HTTP methods on shared paths
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    for (const method of httpMethods) {
      const oldOp = oldPathObj[method];
      const newOp = newPathObj[method];

      if (oldOp && !newOp) {
        breakingChanges.push({
          id: `method-removed-${pathKey}-${method}`,
          type: 'ENDPOINT_DEPRECATED',
          path: pathKey,
          method: method.toUpperCase(),
          description: `Method ${method.toUpperCase()} removed from path '${pathKey}'`,
        });
        continue;
      }

      if (oldOp && newOp) {
        // Compare Parameters & Request Bodies
        const diffs = compareOperations(pathKey, method, oldOp, newOp);
        breakingChanges.push(...diffs.changes);
        renameRules.push(...diffs.renames);
      }
    }
  }

  // 2. Compare Global Schemas / Components
  const oldSchemas = oldSpec.components?.schemas || {};
  const newSchemas = newSpec.components?.schemas || {};

  for (const [schemaName, oldSchema] of Object.entries(oldSchemas)) {
    const newSchema = newSchemas[schemaName];
    if (newSchema) {
      const schemaRenames = compareSchemaProperties(schemaName, oldSchema, newSchema);
      renameRules.push(...schemaRenames.renames);
      breakingChanges.push(...schemaRenames.changes);
    }
  }

  // Deduplicate rename rules by oldName + targetObject
  const uniqueRenameRules = deduplicateRenameRules(renameRules);
  const uniqueEndpointRules = deduplicateEndpointRules(endpointUpdateRules);

  const hasBreakingChanges = breakingChanges.length > 0;
  const summary = hasBreakingChanges
    ? `Detected ${breakingChanges.length} breaking change(s), ${uniqueRenameRules.length} parameter rename rule(s), and ${uniqueEndpointRules.length} endpoint update rule(s).`
    : 'No breaking changes detected between specs.';

  return {
    hasBreakingChanges,
    breakingChanges,
    renameRules: uniqueRenameRules,
    endpointUpdateRules: uniqueEndpointRules,
    summary,
  };
}

/**
 * Safely parses input spec (object or JSON string / file path)
 */
async function parseSpec(input: OpenAPIObject | string): Promise<OpenAPIObject> {
  if (typeof input === 'object' && input !== null) {
    return input;
  }
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as OpenAPIObject;
    } catch {
      // Try resolving via SwaggerParser if string is a URL or file path
      try {
        const api = await SwaggerParser.dereference(input);
        return api as OpenAPIObject;
      } catch (err) {
        throw new Error(`Failed to parse OpenAPI spec input: ${String(err)}`);
      }
    }
  }
  throw new Error('Invalid OpenAPI spec input provided.');
}

/**
 * Compares two operation objects for parameter and request body renames
 */
function compareOperations(
  path: string,
  method: string,
  oldOp: any,
  newOp: any
): { changes: BreakingChange[]; renames: RenameRule[] } {
  const changes: BreakingChange[] = [];
  const renames: RenameRule[] = [];
  const targetObject = deriveFunctionName(path);

  // 1. Compare parameters array (query, path, header params)
  const oldParams: any[] = oldOp.parameters || [];
  const newParams: any[] = newOp.parameters || [];

  const oldParamNames = new Set(oldParams.map((p) => p.name));
  const newParamNames = new Set(newParams.map((p) => p.name));

  const removedParams = oldParams.filter((p) => !newParamNames.has(p.name));
  const addedParams = newParams.filter((p) => !oldParamNames.has(p.name));

  // Heuristic / Explicit check for parameter renames
  for (const removed of removedParams) {
    // Check if new param has explicit x-apishift-renamed-from extension or structural match
    const match = addedParams.find(
      (added) =>
        added['x-apishift-renamed-from'] === removed.name ||
        (added.in === removed.in && added.schema?.type === removed.schema?.type)
    );

    if (match) {
      const rule: RenameRule = {
        oldName: removed.name,
        newName: match.name,
        targetObject,
        context: `${method.toUpperCase()} ${path} (${removed.in})`,
      };
      renames.push(rule);
      changes.push({
        id: `param-renamed-${path}-${method}-${removed.name}`,
        type: 'PARAM_RENAMED',
        path,
        method: method.toUpperCase(),
        description: `Parameter '${removed.name}' renamed to '${match.name}' in ${method.toUpperCase()} ${path}`,
        renameRule: rule,
      });
    } else {
      changes.push({
        id: `param-removed-${path}-${method}-${removed.name}`,
        type: 'PARAM_REMOVED',
        path,
        method: method.toUpperCase(),
        description: `Parameter '${removed.name}' removed from ${method.toUpperCase()} ${path}`,
      });
    }
  }

  // 2. Compare JSON Request Body schemas
  const oldBodyProps = extractRequestBodyProps(oldOp);
  const newBodyProps = extractRequestBodyProps(newOp);

  if (oldBodyProps && newBodyProps) {
    const oldPropsSet = new Set(Object.keys(oldBodyProps));
    const newPropsSet = new Set(Object.keys(newBodyProps));

    const removedBodyKeys = Object.keys(oldBodyProps).filter((k) => !newPropsSet.has(k));
    const addedBodyKeys = Object.keys(newBodyProps).filter((k) => !oldPropsSet.has(k));

    for (const removedKey of removedBodyKeys) {
      // Look for candidate rename match
      const matchedKey = addedBodyKeys.find((addedKey) => {
        const addedSchema = newBodyProps[addedKey];
        return (
          addedSchema?.['x-apishift-renamed-from'] === removedKey ||
          (addedBodyKeys.length === 1 && removedBodyKeys.length === 1) ||
          isRenamePair(removedKey, addedKey)
        );
      });

      if (matchedKey) {
        const rule: RenameRule = {
          oldName: removedKey,
          newName: matchedKey,
          targetObject,
          context: `requestBody (${method.toUpperCase()} ${path})`,
        };
        renames.push(rule);
        changes.push({
          id: `prop-renamed-${path}-${method}-${removedKey}`,
          type: 'PROPERTY_RENAMED',
          path,
          method: method.toUpperCase(),
          description: `Request body field '${removedKey}' renamed to '${matchedKey}' in ${method.toUpperCase()} ${path}`,
          renameRule: rule,
        });
      } else {
        changes.push({
          id: `prop-removed-${path}-${method}-${removedKey}`,
          type: 'PARAM_REMOVED',
          path,
          method: method.toUpperCase(),
          description: `Request body field '${removedKey}' removed from ${method.toUpperCase()} ${path}`,
        });
      }
    }
  }

  return { changes, renames };
}

/**
 * Extracts request body properties from an operation spec
 */
function extractRequestBodyProps(op: any): Record<string, any> | null {
  const content = op?.requestBody?.content;
  if (!content) return null;
  const jsonSchema = content['application/json']?.schema;
  if (jsonSchema && jsonSchema.properties) {
    return jsonSchema.properties;
  }
  return null;
}

/**
 * Compares OpenAPI components/schemas properties
 */
function compareSchemaProperties(
  schemaName: string,
  oldSchema: any,
  newSchema: any
): { changes: BreakingChange[]; renames: RenameRule[] } {
  const changes: BreakingChange[] = [];
  const renames: RenameRule[] = [];

  const oldProps = oldSchema.properties || {};
  const newProps = newSchema.properties || {};

  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  const removedKeys = oldKeys.filter((k) => !newKeys.includes(k));
  const addedKeys = newKeys.filter((k) => !oldKeys.includes(k));

  for (const removed of removedKeys) {
    const matched = addedKeys.find(
      (added) =>
        newProps[added]?.['x-apishift-renamed-from'] === removed || isRenamePair(removed, added)
    );
    if (matched) {
      const rule: RenameRule = {
        oldName: removed,
        newName: matched,
        context: `schema:${schemaName}`,
      };
      renames.push(rule);
      changes.push({
        id: `schema-prop-renamed-${schemaName}-${removed}`,
        type: 'PROPERTY_RENAMED',
        path: `#/components/schemas/${schemaName}`,
        description: `Property '${removed}' in schema '${schemaName}' renamed to '${matched}'`,
        renameRule: rule,
      });
    }
  }

  return { changes, renames };
}

/**
 * Helper to match path changes (e.g., /v1/charges -> /v1/payment_intents)
 */
function findRenamedPath(
  oldPath: string,
  oldPathObj: any,
  newPaths: Record<string, any>
): { newPath: string } | null {
  for (const [newPath, newPathObj] of Object.entries(newPaths)) {
    if (newPathObj['x-apishift-migrated-from'] === oldPath) {
      return { newPath };
    }
    // Heuristic for matching domain endpoint evolution
    const oldBase = oldPath.split('/')[1] || '';
    const newBase = newPath.split('/')[1] || '';
    if (oldBase && newBase && oldBase !== newBase && oldPathObj.post && newPathObj.post) {
      if (
        (oldPath.includes('charges') && newPath.includes('payment_intents')) ||
        (oldPath.includes('customers/legacy') && newPath.includes('customers'))
      ) {
        return { newPath };
      }
    }
  }
  return null;
}

/**
 * Known rename pair matching logic (e.g. card -> payment_method, source -> payment_method_id)
 */
function isRenamePair(oldName: string, newName: string): boolean {
  const commonPairs: Array<[string, string]> = [
    ['card', 'payment_method'],
    ['source', 'payment_method_id'],
    ['api_key', 'access_token'],
    ['user_id', 'account_id'],
    ['phone', 'phone_number'],
  ];

  return commonPairs.some(([o, n]) => oldName === o && newName === n);
}

/**
 * Derives SDK method string from OpenAPI path (e.g. '/v1/charges' -> 'charges.create')
 */
function deriveFunctionName(path: string): string {
  const segments = path.split('/').filter(Boolean).filter((s) => !s.startsWith('{'));
  if (segments.length === 0) return 'apiCall';
  const resource = segments[segments.length - 1] || 'api';
  return resource;
}

function deduplicateRenameRules(rules: RenameRule[]): RenameRule[] {
  const seen = new Set<string>();
  return rules.filter((r) => {
    const key = `${r.oldName}->${r.newName}:${r.targetObject || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateEndpointRules(rules: EndpointUpdateRule[]): EndpointUpdateRule[] {
  const seen = new Set<string>();
  return rules.filter((r) => {
    const key = `${r.oldPath}->${r.newPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
