import { Buffer } from 'node:buffer';
import { Octokit } from '@octokit/rest';
import { rewriteAST, type RenameRule, type EndpointUpdateRule } from '@apishift/core';

export interface CreateRefactoringPROptions {
  octokit: Octokit;
  owner: string;
  repo: string;
  baseBranch?: string;
  filePaths: string[];
  renameRules: RenameRule[];
  endpointUpdateRules?: EndpointUpdateRule[];
  summaryText?: string;
}

export interface PROperationResult {
  prUrl: string;
  prNumber: number;
  branchName: string;
  filesModified: string[];
  rulesAppliedCount: number;
}

/**
 * Creates an automated refactoring Pull Request using Octokit.
 * Follows APIShift PR generation standards.
 */
export async function createRefactoringPR(
  options: CreateRefactoringPROptions
): Promise<PROperationResult | null> {
  const {
    octokit,
    owner,
    repo,
    baseBranch = 'main',
    filePaths,
    renameRules,
    endpointUpdateRules = [],
    summaryText = 'Automated API Breaking Change Refactor',
  } = options;

  // 1. Get base branch commit SHA
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  const baseSha = refData.object.sha;

  // 2. Create unique feature branch name
  const branchName = `apishift/update-api-${Date.now()}`;
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  const filesModified: string[] = [];
  let totalRulesApplied = 0;

  // 3. Process each targeted file: fetch, run AST rewriter, commit changes
  for (const filePath of filePaths) {
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });

      if (!('content' in fileData) || typeof fileData.content !== 'string') {
        continue;
      }

      const existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

      // Execute deterministic AST rewriter
      const transformResult = rewriteAST(existingContent, {
        renames: renameRules,
        endpointUpdates: endpointUpdateRules,
        filename: filePath,
      });

      if (transformResult.hasChanges) {
        filesModified.push(filePath);
        totalRulesApplied += transformResult.modifiedCount;

        // Commit updated file to branch
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `refactor(api): auto-update breaking changes in ${filePath}`,
          content: Buffer.from(transformResult.code).toString('base64'),
          sha: fileData.sha,
          branch: branchName,
        });
      }
    } catch (err) {
      console.warn(`Failed to process file ${filePath} for PR:`, err);
    }
  }

  // If no files modified, skip PR creation
  if (filesModified.length === 0) {
    return null;
  }

  // 4. Generate Automated PR Body
  const prBody = generatePRBody({
    renameRules,
    endpointUpdateRules,
    filesModified,
    summaryText,
  });

  // 5. Open Pull Request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: 'refactor(api): auto-update breaking API changes via APIShift Bot 🤖',
    head: branchName,
    base: baseBranch,
    body: prBody,
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
    branchName,
    filesModified,
    rulesAppliedCount: totalRulesApplied,
  };
}

/**
 * Generates APIShift PR body documentation format
 */
function generatePRBody(params: {
  renameRules: RenameRule[];
  endpointUpdateRules: EndpointUpdateRule[];
  filesModified: string[];
  summaryText: string;
}): string {
  const { renameRules, endpointUpdateRules, filesModified, summaryText } = params;

  let body = `## 🤖 APIShift Bot Breaking API Change Notice\n\n`;
  body += `> ${summaryText}\n\n`;

  body += `### 📋 Summary of Deterministic Code Refactorings\n\n`;

  if (renameRules.length > 0) {
    body += `#### Parameter / Property Renames:\n`;
    renameRules.forEach((rule) => {
      body += `- \`${rule.oldName}\` ➔ \`${rule.newName}\` ${rule.context ? `_(${rule.context})_` : ''}\n`;
    });
    body += `\n`;
  }

  if (endpointUpdateRules.length > 0) {
    body += `#### Endpoint & Function Updates:\n`;
    endpointUpdateRules.forEach((ep) => {
      body += `- Path: \`${ep.oldPath}\` ➔ \`${ep.newPath}\`\n`;
      if (ep.oldFunctionName && ep.newFunctionName) {
        body += `  Function: \`${ep.oldFunctionName}\` ➔ \`${ep.newFunctionName}\`\n`;
      }
    });
    body += `\n`;
  }

  body += `### 📁 Modified Files (${filesModified.length})\n\n`;
  filesModified.forEach((f) => {
    body += `- \`${f}\`\n`;
  });
  body += `\n`;

  body += `---\n\n`;
  body += `<details>\n`;
  body += `<summary>🔍 <strong>APIShift Bot Commands & Options</strong></summary>\n\n`;
  body += `You can trigger APIShift Bot actions by commenting on this PR:\n`;
  body += `- \`@apishift rebase\` will rebase this PR on target branch\n`;
  body += `- \`@apishift ignore\` will close this PR and prevent future auto-refactors for these rules\n`;
  body += `</details>\n\n`;
  body += `_Powered by [APIShift Bot](https://github.com/TurboRx/APIShift-Bot) — Zero AI Token Cost Deterministic Refactoring Engine._`;

  return body;
}
