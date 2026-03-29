import { listDevices } from '../../lib/android/emulator.js';
import { table, statusBadge } from '../../utils/display.js';
import { logger } from '../../utils/logger.js';

export async function androidDeviceList(): Promise<void> {
  const devices = listDevices();

  if (devices.length === 0) {
    logger.warn('No Android emulators found.');
    logger.info('Run: emuku create android  — to set up Android emulator prerequisites');
    return;
  }

  console.log();
  const rows = devices.map(d => [
    d.avdName,
    statusBadge(d.state),
    d.port ? String(d.port) : '—',
  ]);
  table(['AVD Name', 'State', 'Port'], rows);
  console.log();
}
