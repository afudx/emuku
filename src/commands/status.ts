import { listDevices as listAndroidDevices } from '../lib/android/emulator.js';
import { listDevices as listIOSDevices } from '../lib/ios/simulator.js';
import { logger } from '../utils/logger.js';

export async function status(): Promise<string[] | void> {
  const runningIOS = listIOSDevices().filter(d => d.state === 'Booted');
  const runningAndroid = listAndroidDevices().filter(d => d.state === 'Running');

  if (runningIOS.length === 0 && runningAndroid.length === 0) {
    return ['No device currently running'];
  }

  const lines: string[] = [];

  if (runningIOS.length > 0) {
    lines.push('Running iOS Devices:');
    runningIOS.forEach(d => {
      lines.push(`  - ${d.name} (${d.runtime})`);
    });
  }

  if (runningAndroid.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Running Android Devices:');
    runningAndroid.forEach(d => {
      lines.push(`  - ${d.avdName}`);
    });
  }
  
  return lines;
}
