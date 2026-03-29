import enquirer from 'enquirer';
import { listDevices, startDevice, findDevice } from '../../lib/android/emulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

export async function androidDeviceStart(id?: string): Promise<void> {
  let targetAvd: string;

  if (id) {
    const device = findDevice(id);
    if (!device) {
      logger.error(`AVD not found: ${id}`);
      logger.info('Run: emuku android device list  — to see available emulators');
      return;
    }
    targetAvd = device.avdName;
  } else {
    const devices = listDevices();
    if (devices.length === 0) {
      logger.warn('No Android emulators found.');
      logger.info('Run: emuku create android  — to set up Android emulator prerequisites');
      return;
    }

    const stopped = devices.filter(d => d.state === 'Stopped');
    const choices = (stopped.length > 0 ? stopped : devices).map(d => ({
      name: d.avdName,
      message: `${d.avdName}  [${d.state}]`,
      value: d.avdName,
    }));

    const response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: 'Select an emulator to start:',
      choices,
    });

    targetAvd = response.device;
  }

  logger.info(`Starting ${targetAvd}...`);
  const result = startDevice(targetAvd);

  if (!result.success) {
    logger.error(`Failed to start ${targetAvd}: ${result.error}`);
    return;
  }

  logger.success(`${targetAvd} starting in background.`);
  logger.info('The emulator window will appear shortly.');
}
