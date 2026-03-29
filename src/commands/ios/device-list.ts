import { listDevices } from '../../lib/ios/simulator.js';
import { table, statusBadge } from '../../utils/display.js';
import { logger } from '../../utils/logger.js';

export async function iosDeviceList(): Promise<void> {
  const devices = listDevices();

  if (devices.length === 0) {
    logger.warn('No iOS simulators found.');
    logger.info('Run: emuku create ios  — to set up iOS simulator prerequisites');
    return;
  }

  const byRuntime = new Map<string, typeof devices>();
  for (const d of devices) {
    const list = byRuntime.get(d.runtime) ?? [];
    list.push(d);
    byRuntime.set(d.runtime, list);
  }

  const runtimes = [...byRuntime.keys()].sort((a, b) => b.localeCompare(a));

  for (const runtime of runtimes) {
    console.log();
    console.log(`  ${runtime}`);
    const rows = byRuntime.get(runtime)!.map(d => [
      d.name,
      d.udid,
      statusBadge(d.state),
    ]);
    table(['Name', 'UDID', 'State'], rows);
  }

  console.log();
}
