import { listDevices } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

export async function iosDeviceStatus(): Promise<void> {
  const runningIOS = listDevices().filter(d => d.state === 'Booted');

  if (runningIOS.length === 0) {
    logger.info('No iOS device currently running');
    return;
  }

  logger.info('Running iOS Devices:');
  runningIOS.forEach(d => {
    logger.info(`  - ${d.name} (${d.runtime})`);
  });
}
