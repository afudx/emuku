import { listDevices } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

import c from 'ansi-colors';

export async function iosDeviceStatus(): Promise<string[] | void> {
  const runningIOS = listDevices().filter(d => d.state === 'Booted');

  if (runningIOS.length === 0) {
    return [c.cyan('ℹ No iOS device currently running')];
  }

  const lines: string[] = [c.cyan('ℹ Running iOS Devices:')];
  runningIOS.forEach(d => {
    lines.push(`  - ${d.name} (${d.runtime})`);
  });
  return lines;
}
