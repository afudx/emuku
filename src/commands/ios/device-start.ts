import enquirer from 'enquirer';
import { listDevices, startDevice, findDevice } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

export async function iosDeviceStart(id?: string): Promise<void> {
  let targetUdid: string;
  let targetName: string;

  if (id) {
    const device = findDevice(id);
    if (!device) {
      logger.error(`Device not found: ${id}`);
      logger.info('Run: emuku ios device list  — to see available devices');
      return;
    }
    targetUdid = device.udid;
    targetName = device.name;
  } else {
    const devices = listDevices();
    if (devices.length === 0) {
      logger.warn('No iOS simulators found.');
      logger.info('Run: emuku create ios  — to set up iOS simulator prerequisites');
      return;
    }

    const choices = devices.map(d => ({
      name: d.udid,
      message: `${d.name}  ${d.runtime}  [${d.state}]`,
      value: d.udid,
    }));

    const response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: 'Select a simulator to start:',
      choices,
    });

    targetUdid = response.device;
    targetName = devices.find(d => d.udid === response.device)?.name ?? response.device;
  }

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
