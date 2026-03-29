import { listDevices as listAndroidDevices } from '../lib/android/emulator.js';
import { listDevices as listIOSDevices } from '../lib/ios/simulator.js';
import { logger } from '../utils/logger.js';

export async function status(): Promise<void> {
  const runningIOS = listIOSDevices().filter(d => d.state === 'Booted');
  const runningAndroid = listAndroidDevices().filter(d => d.state === 'Running');

  if (runningIOS.length === 0 && runningAndroid.length === 0) {
    logger.info('No device currently running');
    return;
  }

  if (runningIOS.length > 0) {
    logger.info('Running iOS Devices:');
    runningIOS.forEach(d => {
      logger.info(`  - ${d.name} (${d.runtime})`);
    });
  }

  if (runningAndroid.length > 0) {
    logger.info('Running Android Devices:');
    runningAndroid.forEach(d => {
      logger.info(`  - ${d.avdName}`);
    });
  }
}
