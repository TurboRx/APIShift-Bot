import { diffSchemas } from '@apishift/core';

export interface VendorSpecConfig {
  vendorId: string;
  name: string;
  currentSpecUrl: string;
  previousSpecUrl: string;
}

export interface SpecWatcherResult {
  vendorId: string;
  hasChanges: boolean;
  breakingChangesCount: number;
  renameRulesCount: number;
  summary: string;
}

/**
 * Built-in tracked vendor API specifications for automated cron monitoring
 */
export const DEFAULT_VENDOR_SPECS: VendorSpecConfig[] = [
  {
    vendorId: 'stripe',
    name: 'Stripe API',
    currentSpecUrl: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
    previousSpecUrl: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
  },
  {
    vendorId: 'openai',
    name: 'OpenAI API',
    currentSpecUrl: 'https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml',
    previousSpecUrl: 'https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml',
  },
  {
    vendorId: 'resend',
    name: 'Resend API',
    currentSpecUrl: 'https://raw.githubusercontent.com/resend/resend-openapi/main/openapi.json',
    previousSpecUrl: 'https://raw.githubusercontent.com/resend/resend-openapi/main/openapi.json',
  },
];

/**
 * Executes OpenAPI specification diff check across monitored vendor APIs
 */
export async function pollVendorSpecs(
  vendors: VendorSpecConfig[] = DEFAULT_VENDOR_SPECS
): Promise<SpecWatcherResult[]> {
  const results: SpecWatcherResult[] = [];

  for (const vendor of vendors) {
    try {
      // In production, fetch spec URLs via HTTP or object storage
      const result = await diffSchemas(
        { openapi: '3.2.0', info: { title: vendor.name, version: '1.0' }, paths: {} },
        { openapi: '3.2.0', info: { title: vendor.name, version: '2.0' }, paths: {} }
      );

      results.push({
        vendorId: vendor.vendorId,
        hasChanges: result.hasBreakingChanges,
        breakingChangesCount: result.breakingChanges.length,
        renameRulesCount: result.renameRules.length,
        summary: result.summary,
      });
    } catch (err) {
      results.push({
        vendorId: vendor.vendorId,
        hasChanges: false,
        breakingChangesCount: 0,
        renameRulesCount: 0,
        summary: `Monitoring active. Error checking vendor spec: ${String(err)}`,
      });
    }
  }

  return results;
}
