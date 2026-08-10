import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface InitOptions {
  force?: boolean;
}

export function initCommand(options: InitOptions = {}): void {
  const targetPath = path.join(process.cwd(), 'apishift.config.json');

  if (fs.existsSync(targetPath) && !options.force) {
    console.log(chalk.yellow('⚠️  apishift.config.json already exists in the current directory.'));
    console.log(chalk.gray('Use --force to overwrite the existing configuration.'));
    return;
  }

  const defaultConfig = {
    $schema: 'https://apishift.dev/schema.json',
    version: '1.0',
    openapi: {
      specPath: './openapi.json',
      upstreamUrl: 'https://api.example.com/openapi.json',
    },
    targetFiles: ['src/**/*.ts', 'src/**/*.js', 'src/**/*.tsx', 'src/**/*.jsx'],
    rules: {
      autoRenameProperties: true,
      autoUpdateEndpoints: true,
    },
    githubBot: {
      autoPr: true,
      branchPrefix: 'apishift/update-api',
      commitMessage: 'refactor(api): auto-update breaking changes via APIShift Bot',
    },
  };

  fs.writeFileSync(targetPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');

  console.log(chalk.green('✨ Successfully initialized APIShift configuration!'));
  console.log(chalk.blue(`📄 Created: ${targetPath}`));
  console.log(chalk.gray('\nNext steps:'));
  console.log(chalk.gray('  1. Edit apishift.config.json with your OpenAPI spec path.'));
  console.log(chalk.gray('  2. Run `apishift diff` or connect APIShift Bot GitHub App.'));
}
