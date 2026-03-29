import { listDevices } from '../../lib/android/emulator.js';
import { logger } from '../../utils/logger.js';

export async function androidDeviceStatus(): Promise<void> {
  const runningAndroid = listDevices().filter(d => d.state === 'Running');

  if (runningAndroid.length === 0) {
    logger.info('No Android device currently running');
    return;
  }

  logger.info('Running Android Devices:');
  runningAndroid.forEach(d => {
    logger.info(`  - ${d.avdName}`);
  });
}
