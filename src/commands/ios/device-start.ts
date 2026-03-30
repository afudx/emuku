import enquirer from 'enquirer';
import { listDevices, startDevice, findDevice } from '../../lib/ios/simulator.js';
import { logger } from '../../utils/logger.js';

const { prompt } = enquirer;

export type PromptFn = (choices: any[], message: string) => Promise<string | null>;

export async function iosDeviceStart(id?: string, promptFn?: PromptFn): Promise<void> {
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

  let targetUdid: string;
  
  if (promptFn) {
    const res = await promptFn(choices, 'Select a simulator to start');
    if (!res) return; // cancelled
    targetUdid = res;
  } else {
    const response = await prompt<{ device: string }>({
      type: 'select',
      name: 'device',
      message: 'Select a simulator to start',
      choices,
      initial,
    });
    targetUdid = response.device;
  }

  const targetName = devices.find(d => d.udid === targetUdid)?.name ?? targetUdid;

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
