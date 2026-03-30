import { listDevices } from '../../lib/android/emulator.js';
import { logger } from '../../utils/logger.js';

import c from 'ansi-colors';

export async function androidDeviceStatus(): Promise<string[] | void> {
  const runningAndroid = listDevices().filter(d => d.state === 'Running');

  if (runningAndroid.length === 0) {
    return [c.cyan('ℹ No Android device currently running')];
  }

  const lines: string[] = [c.cyan('ℹ Running Android Devices:')];
  runningAndroid.forEach(d => {
    lines.push(`  - ${d.avdName}`);
  });
  return lines;
}
