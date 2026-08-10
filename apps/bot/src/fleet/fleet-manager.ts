import type { Octokit } from '@octokit/rest';
import { createRefactoringPR, type PROperationResult } from '../github/pr.js';
import type { RenameRule, EndpointUpdateRule } from '@apishift/core';

export interface FleetRepositoryTarget {
  owner: string;
  repo: string;
  baseBranch?: string;
  targetFiles?: string[];
}

export interface FleetMigrationJob {
  jobId: string;
  repositories: FleetRepositoryTarget[];
  renameRules: RenameRule[];
  endpointUpdateRules: EndpointUpdateRule[];
  summaryText?: string;
}

export interface FleetRepositoryResult {
  owner: string;
  repo: string;
  status: 'success' | 'no_changes' | 'failed';
  prUrl?: string;
  prNumber?: number;
  filesModified?: number;
  error?: string;
}

export interface FleetBatchResult {
  jobId: string;
  totalRepositories: number;
  successfulCount: number;
  noChangesCount: number;
  failedCount: number;
  results: FleetRepositoryResult[];
  timestamp: string;
}

/**
 * Fleet Migration Manager: Multi-repository batch orchestrator that scans,
 * refactors, and dispatches Pull Requests across multiple repositories simultaneously.
 */
export async function batchFleetRefactor(
  octokit: Octokit,
  job: FleetMigrationJob
): Promise<FleetBatchResult> {
  const results: FleetRepositoryResult[] = [];
  let successfulCount = 0;
  let noChangesCount = 0;
  let failedCount = 0;

  for (const target of job.repositories) {
    try {
      const prResult: PROperationResult | null = await createRefactoringPR({
        octokit,
        owner: target.owner,
        repo: target.repo,
        baseBranch: target.baseBranch || 'main',
        filePaths: target.targetFiles || ['src/**/*.ts', 'src/**/*.js'],
        renameRules: job.renameRules,
        endpointUpdateRules: job.endpointUpdateRules,
        summaryText: job.summaryText || `Fleet Batch Refactor Job '${job.jobId}'`,
      });

      if (prResult) {
        successfulCount++;
        results.push({
          owner: target.owner,
          repo: target.repo,
          status: 'success',
          prUrl: prResult.prUrl,
          prNumber: prResult.prNumber,
          filesModified: prResult.filesModified.length,
        });
      } else {
        noChangesCount++;
        results.push({
          owner: target.owner,
          repo: target.repo,
          status: 'no_changes',
          filesModified: 0,
        });
      }
    } catch (err) {
      failedCount++;
      results.push({
        owner: target.owner,
        repo: target.repo,
        status: 'failed',
        error: String(err),
      });
    }
  }

  return {
    jobId: job.jobId,
    totalRepositories: job.repositories.length,
    successfulCount,
    noChangesCount,
    failedCount,
    results,
    timestamp: new Date().toISOString(),
  };
}
