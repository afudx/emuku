import c from 'ansi-colors';
import { checkPrerequisites, installMissing } from '../../lib/android/prerequisites.js';
import { renderChecklist } from '../../utils/checklist.js';
import { logger } from '../../utils/logger.js';

export async function createAndroidStatus(): Promise<string[]> {
  const lines: string[] = [];
  lines.push(c.bold('Android Emulator Prerequisites'));
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

export async function createAndroid(leftLines?: string[]): Promise<void> {
  const checks = checkPrerequisites();
  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    logger.success('All prerequisites are installed. You\'re ready to use Android emulators.');
    return;
  }

  await installMissing(missing);

  console.log();
  logger.info('Re-checking prerequisites...');
  console.log();

  const rechecked = checkPrerequisites();

  const stillMissing = rechecked.filter(c => !c.installed);
  if (stillMissing.length === 0) {
    logger.success('All prerequisites installed successfully!');
  } else {
    logger.warn('Some items still need attention.');
  }
}
