import enquirer from 'enquirer';
import { listDevices, stopDevice, findDevice } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

async function selectAndStop(): Promise<boolean> {
  const running = listDevices().filter(d => d.state === 'Booted');
  if (running.length === 0) {
    return false;
  }

  const choices = running.map(d => ({
    name: d.udid,
    message: `${d.name}  ${d.runtime}`,
    value: d.udid,
  }));

  let response: { device: string };
  try {
    response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: `Select a simulator to stop:

Esc to cancel`,
      choices,
    });
  } catch (e) {
    if (e === '') {
      logger.info('Cancelled');
      process.exit(0);
    }
    throw e;
  }

  const targetUdid = response.device;
  const targetName = running.find(d => d.udid === targetUdid)?.name ?? targetUdid;

  logger.info(`Stopping ${targetName}...`);
  const result = stopDevice(targetUdid);

  if (!result.success) {
    logger.error(`Failed to stop ${targetName}: ${result.error}`);
  } else {
    logger.success(`${targetName} stopped.`);
  }

  return true;
}

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

  // Interactive mode
  let keepGoing = true;
  while (keepGoing) {
    keepGoing = await selectAndStop();
  }

  logger.info('All devices have been stopped.');
}
