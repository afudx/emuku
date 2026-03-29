import enquirer from 'enquirer';
import { listDevices, startDevice, findDevice } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

export async function iosDeviceStart(id?: string): Promise<void> {
  const devices = listDevices();
  if (devices.length === 0) {
    logger.info('no device currently available');
    return;
  }

  const choices = devices.map(d => ({
    name: d.udid,
    message: `${d.name}  ${d.runtime}  [${d.state}]`,
    value: d.udid,
  }));

  let initial: string | undefined;
  if (id) {
    const device = findDevice(id);
    if (device) {
      initial = device.udid;
    } else {
      logger.warn(`Device not found for "${id}". Please select from the list.`);
    }
  }

  let response: { device: string };
  try {
    response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: 'Select a simulator to start:\n\nEsc to cancel',
      choices,
      initial,
    });
  } catch (e) {
    if (e === '') {
      logger.info('Cancelled');
      return;
    }
    throw e;
  }

  const targetUdid = response.device;
  const targetName = devices.find(d => d.udid === response.device)?.name ?? response.device;

  logger.info(`Starting ${targetName}...`);
  const result = startDevice(targetUdid);

  if (result.alreadyBooted) {
    logger.info(`${targetName} is already running.`);
    return;
  }

  if (!result.success) {
    logger.error(`Failed to start ${targetName}: ${result.error}`);
    return;
  }

  logger.success(`${targetName} started.`);
}
