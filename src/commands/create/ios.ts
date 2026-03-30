import c from 'ansi-colors';
import { checkPrerequisites, installMissing } from '../../lib/ios/prerequisites.js';
import { renderChecklist } from '../../utils/checklist.js';
import { logger } from '../../utils/logger.js';

export async function createIosStatus(): Promise<string[]> {
  const lines: string[] = [];
  if (process.platform !== 'darwin') {
    lines.push(c.red('iOS simulator management is only supported on macOS'));
    return lines;
  }

  lines.push(c.bold('iOS Simulator Prerequisites'));
  lines.push('');

  const checks = checkPrerequisites();
  lines.push(...renderChecklist(checks));
  lines.push('');

  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    lines.push(c.green('All prerequisites are installed.'));
  } else {
    lines.push(c.yellow(`${missing.length} prerequisite(s) missing.`));
  }

  return lines;
}

export async function createIos(leftLines?: string[]): Promise<void> {
  const checks = checkPrerequisites();
  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    logger.success('All prerequisites are installed. You\'re ready to use iOS simulators.');
    return;
  }

  await installMissing(missing);

  console.log();
  logger.info('Re-checking prerequisites...');
  console.log();

  const rechecked = checkPrerequisites();
  if (rechecked.filter(c => !c.installed).length === 0) {
    logger.success('All prerequisites installed successfully!');
  } else {
    logger.warn('Some items still need attention.');
  }
}
