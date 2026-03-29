import enquirer from 'enquirer';
import { listDevices, stopDevice, findDevice } from '../../lib/android/emulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

async function selectAndStop(): Promise<boolean> {
  const running = listDevices().filter(d => d.state === 'Running');
  if (running.length === 0) {
    return false;
  }

  const choices = running.map(d => ({
    name: d.avdName,
    message: d.avdName,
    value: d.avdName,
  }));

  const response = await prompt<{ device: string }>({
    type: 'select',
    name: 'device',
    message: `Select an emulator to stop:\n\nEsc to cancel`,
    choices,
  });

  const targetAvd = response.device;

  logger.info(`Stopping ${targetAvd}...`);
  const result = stopDevice(targetAvd);

  if (!result.success) {
    logger.error(`Failed to stop ${targetAvd}: ${result.error}`);
  } else {
    logger.success(`${targetAvd} stopped.`);
  }

  return true;
}

export async function androidDeviceStop(id?: string): Promise<void> {
  if (id) {
    const device = findDevice(id);
    if (!device) {
      logger.error(`AVD not found: ${id}`);
      return;
    }
    if (device.state !== 'Running') {
      logger.info(`${device.avdName} is not running.`);
      return;
    }
    logger.info(`Stopping ${device.avdName}...`);
    const result = stopDevice(device.avdName);
    if (!result.success) {
      logger.error(`Failed to stop ${device.avdName}: ${result.error}`);
    } else {
      logger.success(`${device.avdName} stopped.`);
    }
    return;
  }

  // Interactive mode
  let keepGoing = true;
  while (keepGoing) {
    keepGoing = await selectAndStop();
  }

  logger.info('All devices have been stopped.');
}
