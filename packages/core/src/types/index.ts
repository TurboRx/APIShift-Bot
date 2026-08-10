/**
 * Type definitions for APIShift Core Engine
 */

export type BreakingChangeType =
  | 'PARAM_RENAMED'
  | 'PARAM_REMOVED'
  | 'ENDPOINT_DEPRECATED'
  | 'ENDPOINT_RENAMED'
  | 'PROPERTY_RENAMED';

export interface RenameRule {
  /** The old parameter or property name (e.g., 'card') */
  oldName: string;
  /** The new parameter or property name (e.g., 'payment_method') */
  newName: string;
  /** Target scope function or method name (e.g., 'charges.create' or 'create') */
  targetObject?: string;
  /** Context description (e.g., 'requestBody' or 'queryParam') */
  context?: string;
}

export interface EndpointUpdateRule {
  /** Old API path (e.g., '/v1/charges') */
  oldPath: string;
  /** New API path (e.g., '/v1/payment_intents') */
  newPath: string;
  /** HTTP method */
  method?: string;
  /** Old function / method name in client library */
  oldFunctionName?: string;
  /** New function / method name in client library */
  newFunctionName?: string;
}

export interface BreakingChange {
  id: string;
  type: BreakingChangeType;
  path: string;
  method?: string;
  description: string;
  renameRule?: RenameRule;
  endpointUpdateRule?: EndpointUpdateRule;
}

export interface SchemaDiffResult {
  hasBreakingChanges: boolean;
  breakingChanges: BreakingChange[];
  renameRules: RenameRule[];
  endpointUpdateRules: EndpointUpdateRule[];
  summary: string;
}

export interface ASTTransformOptions {
  renames?: RenameRule[];
  endpointUpdates?: EndpointUpdateRule[];
  filename?: string;
}

export interface ASTTransformResult {
  code: string;
  hasChanges: boolean;
  modifiedCount: number;
  appliedRules: string[];
}
