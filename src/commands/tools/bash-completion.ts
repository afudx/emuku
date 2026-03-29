import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import enquirer from 'enquirer';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

function getCompletionScript(shell: 'bash' | 'zsh'): string {
  const candidates = [
    join(__dirname, '..', '..', 'completions', `${shell}.sh`), // When running from src
    join(__dirname, '..', '..', '..', 'src', 'completions', `${shell}.sh`), // When running from dist
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  throw new Error(`Completion script not found for ${shell}. Expected at one of:\n${candidates.join('\n')}`);
}

function detectShell(): 'bash' | 'zsh' | 'unknown' {
  const shell = process.env['SHELL'] ?? '';
  if (shell.includes('zsh') || process.env['ZSH_VERSION']) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  return 'unknown';
}

function appendIfMissing(file: string, line: string): boolean {
  const content = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (content.includes(line)) return false;
  writeFileSync(file, content + (content.endsWith('\n') ? '' : '\n') + line + '\n');
  return true;
}

export async function bashCompletion(): Promise<void> {
  const shell = detectShell();
  logger.heading('Install Shell Completions');
  console.log();

  if (shell === 'unknown') {
    logger.warn('Could not detect shell. Please install manually.');
    console.log('\nFor bash, add to ~/.bashrc:');
    console.log('  source ~/.bash_completion.d/emuku');
    console.log('\nFor zsh, add to ~/.zshrc:');
    console.log('  fpath=(~/.zsh/completions $fpath)');
    console.log('  autoload -Uz compinit && compinit');
    return;
  }

  const response = await prompt<{ confirm: boolean }>({
    type: 'confirm',
    name: 'confirm',
    message: `Install ${shell} completions for emuku?`,
    initial: true,
  });

  if (!response.confirm) {
    logger.info('Skipped.');
    return;
  }

  if (shell === 'bash') {
    await installBash();
  } else {
    await installZsh();
  }
}

async function installBash(): Promise<void> {
  const dir = join(homedir(), '.bash_completion.d');
  const file = join(dir, 'emuku');

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const script = getCompletionScript('bash');
  writeFileSync(file, script);
  logger.success(`Written: ${file}`);

  const rcFile = join(homedir(), '.bashrc');
  const sourceLine = `source ~/.bash_completion.d/emuku`;
  const added = appendIfMissing(rcFile, sourceLine);
  if (added) {
    logger.success(`Added source line to ${rcFile}`);
  } else {
    logger.info(`Already present in ${rcFile}`);
  }

  console.log('\nRun: source ~/.bashrc  (or open a new terminal)');
}

async function installZsh(): Promise<void> {
  const ohMyZshDir = join(homedir(), '.oh-my-zsh');
  let completionsDir: string;

  if (existsSync(ohMyZshDir)) {
    completionsDir = join(ohMyZshDir, 'completions');
  } else {
    completionsDir = join(homedir(), '.zsh', 'completions');
  }

  if (!existsSync(completionsDir)) mkdirSync(completionsDir, { recursive: true });

  const file = join(completionsDir, '_emuku');
  const script = getCompletionScript('zsh');
  writeFileSync(file, script);
  logger.success(`Written: ${file}`);

  const rcFile = join(homedir(), '.zshrc');
  const fpathLine = `fpath=(${completionsDir} $fpath)`;
  const compInitLine = `autoload -Uz compinit && compinit`;

  const added1 = appendIfMissing(rcFile, fpathLine);
  const added2 = appendIfMissing(rcFile, compInitLine);
  if (added1 || added2) {
    logger.success(`Updated ${rcFile}`);
  } else {
    logger.info(`Already configured in ${rcFile}`);
  }

  console.log('\nRun: source ~/.zshrc  (or open a new terminal)');
}
