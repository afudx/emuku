import enquirer from 'enquirer';
import { listDevices, stopDevice, findDevice } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

export async function iosDeviceStop(id?: string): Promise<void> {
  if (id) {
    const device = findDevice(id);
    if (!device) {
      logger.error(`Device not found: ${id}`);
      return;
    }
    if (device.state !== 'Booted') {
      logger.info(`${device.name} is not running.`);
      return;
    }
    logger.info(`Stopping ${device.name}...`);
    const result = stopDevice(device.udid);
    if (!result.success) {
      logger.error(`Failed to stop ${device.name}: ${result.error}`);
    } else {
      logger.success(`${device.name} stopped.`);
    }
    return;
  }

  const running = listDevices().filter(d => d.state === 'Booted');
  if (running.length === 0) {
    logger.info('No iOS simulators currently running.');
    return;
  }

  const choices = running.map(d => ({
    name: d.udid,
    message: `${d.name}  ${d.runtime}`,
    value: d.udid,
  }));

  const response = await prompt<{ device: string }>({
    type: 'select',
    name: 'device',
    message: 'Select a simulator to stop',
    choices,
  });

  const targetUdid = response.device;
  const targetName = running.find(d => d.udid === targetUdid)?.name ?? targetUdid;

  logger.info(`Stopping ${targetName}...`);
  const result = stopDevice(targetUdid);

  if (!result.success) {
    logger.error(`Failed to stop ${targetName}: ${result.error}`);
  } else {
    logger.success(`${targetName} stopped.`);
  }
}
