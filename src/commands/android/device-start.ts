import enquirer from 'enquirer';
import { listDevices, startDevice, findDevice } from '../../lib/android/emulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

import type { PromptFn } from '../ios/device-start.js';

export async function androidDeviceStart(id?: string, promptFn?: PromptFn): Promise<void> {
  const devices = listDevices();
  if (devices.length === 0) {
    logger.info('no device currently available');
    return;
  }

  const stopped = devices.filter(d => d.state === 'Stopped');
  const choices = (stopped.length > 0 ? stopped : devices).map(d => ({
    name: d.avdName,
    message: `${d.avdName}  [${d.state}]`,
    value: d.avdName,
  }));

  let initial: string | undefined;
  if (id) {
    const device = findDevice(id);
    if (device) {
      initial = device.avdName;
    } else {
      logger.warn(`AVD not found for "${id}". Please select from the list.`);
    }
  }

  let targetAvd: string;

  if (promptFn) {
    const res = await promptFn(choices, 'Select an emulator to start');
    if (!res) return;
    targetAvd = res;
  } else {
    const response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: 'Select an emulator to start',
      choices,
      initial,
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
