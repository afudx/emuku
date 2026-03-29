import { checkPrerequisites, installMissing } from '../../lib/ios/prerequisites.js';
import { renderChecklist } from '../../utils/checklist.js';
import { logger } from '../../utils/logger.js';

export async function createIos(): Promise<void> {
  if (process.platform !== 'darwin') {
    logger.error('iOS simulators are only available on macOS.');
    process.exit(1);
  }

  logger.heading('iOS Simulator Prerequisites');
  console.log();

  const checks = checkPrerequisites();
  renderChecklist(checks);
  console.log();

  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    logger.success('All prerequisites are installed. You\'re ready to use iOS simulators.');
    logger.info('Run: emuku ios device list  — to see available simulators');
    return;
  }

  logger.warn(`${missing.length} prerequisite(s) missing.`);
  console.log();

  await installMissing(missing);

  console.log();
  logger.info('Re-checking prerequisites...');
  console.log();

  const rechecked = checkPrerequisites();
  renderChecklist(rechecked);
  console.log();

  const stillMissing = rechecked.filter(c => !c.installed);
  if (stillMissing.length === 0) {
    logger.success('All prerequisites installed successfully!');
  } else {
    logger.warn(`${stillMissing.length} item(s) still need attention.`);
  }
}
