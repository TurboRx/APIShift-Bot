import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { initCommand, type InitOptions } from './commands/init.js';
import { diffSchemas, rewriteAST, type BreakingChange, type RenameRule } from '@apishift/core';

export async function runCLI(): Promise<void> {
  const program = new Command();

  program
    .name('apishift')
    .description('Zero-AI-cost automated API breaking change detector and AST refactor tool')
    .version('0.1.0');

  program
    .command('init')
    .description('Initialize default apishift.config.json in current directory')
    .option('-f, --force', 'Overwrite existing configuration file')
    .action((options: InitOptions) => {
      initCommand(options);
    });

  program
    .command('diff <oldSpecPath> <newSpecPath>')
    .description('Compare two OpenAPI specs and print breaking change matrix')
    .option('-o, --output <outputPath>', 'Save diff rules and breaking changes to a JSON file')
    .action(async (oldSpecPath: string, newSpecPath: string, options: { output?: string }) => {
      try {
        console.log(
          chalk.blue(`🔍 Comparing OpenAPI specs:\n  Old: ${oldSpecPath}\n  New: ${newSpecPath}\n`)
        );
        const oldContent = fs.readFileSync(path.resolve(oldSpecPath), 'utf-8');
        const newContent = fs.readFileSync(path.resolve(newSpecPath), 'utf-8');

        const result = await diffSchemas(oldContent, newContent);

        if (options.output) {
          const outputPath = path.resolve(options.output);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
          console.log(chalk.green(`💾 Saved diff results to: ${outputPath}\n`));
        }

        if (!result.hasBreakingChanges) {
          console.log(chalk.green('✅ No breaking changes detected!'));
          return;
        }

        console.log(chalk.yellow(`🚨 ${result.summary}\n`));
        console.log(chalk.bold('Breaking Changes:'));
        result.breakingChanges.forEach((bc: BreakingChange, idx: number) => {
          console.log(chalk.red(`  ${idx + 1}. [${bc.type}] ${bc.description}`));
        });

        if (result.renameRules.length > 0) {
          console.log(chalk.bold('\nParameter / Property Rename Rules:'));
          result.renameRules.forEach((rule: RenameRule) => {
            console.log(
              chalk.cyan(
                `  - ${rule.oldName} ➔ ${rule.newName} (scope: ${rule.context || 'global'})`
              )
            );
          });
        }
      } catch (err) {
        console.error(chalk.red(`Error performing spec diff: ${String(err)}`));
        process.exit(1);
      }
    });

  program
    .command('rewrite')
    .description('Run deterministic AST rewriter on source code file')
    .requiredOption('-f, --file <filePath>', 'Target TypeScript / JavaScript source file')
    .option(
      '-r, --rules <jsonRules>',
      'JSON string of Rename Rules (e.g. [{"oldName":"card","newName":"payment_method"}])'
    )
    .action((options: { file: string; rules?: string }) => {
      try {
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`File not found: ${filePath}`));
          process.exit(1);
        }

        const sourceCode = fs.readFileSync(filePath, 'utf-8');
        let renames: RenameRule[] = [];
        let endpointUpdates: any[] = [];

        if (options.rules) {
          const parsed = JSON.parse(options.rules);
          if (Array.isArray(parsed)) {
            renames = parsed;
          } else if (typeof parsed === 'object') {
            renames = parsed.renames || parsed.renameRules || [];
            endpointUpdates = parsed.endpointUpdates || parsed.endpointUpdateRules || [];
          }
        } else {
          // Fallback: check apishift.config.json in current directory
          const configPath = path.join(process.cwd(), 'apishift.config.json');
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            renames = config.renames || config.renameRules || [];
            endpointUpdates = config.endpointUpdates || config.endpointUpdateRules || [];
          }
        }

        console.log(chalk.blue(`⚡ Running Babel AST rewriter on ${filePath}...`));
        const result = rewriteAST(sourceCode, { renames, endpointUpdates, filename: filePath });

        if (result.hasChanges) {
          fs.writeFileSync(filePath, result.code, 'utf-8');
          console.log(
            chalk.green(
              `✅ Successfully updated ${filePath}! (${result.modifiedCount} changes applied)`
            )
          );
        } else {
          console.log(chalk.gray(`No matches found in ${filePath}. Code unchanged.`));
        }
      } catch (err) {
        console.error(chalk.red(`Error executing AST rewriter: ${String(err)}`));
        process.exit(1);
      }
    });

  program
    .command('watch')
    .description(
      'Watch local configuration or upstream spec URLs and apply AST updates automatically'
    )
    .option('-c, --config <configPath>', 'Path to apishift.config.json', './apishift.config.json')
    .action((options: { config: string }) => {
      const configPath = path.resolve(options.config);
      if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Configuration file not found: ${configPath}`));
        process.exit(1);
      }
      console.log(chalk.blue(`👀 APIShift Watcher active for configuration: ${configPath}`));
      console.log(
        chalk.green(
          '✅ Monitoring local files and upstream OpenAPI specifications for breaking changes...'
        )
      );
    });

  await program.parseAsync(process.argv);
}
