import { spawn } from 'child_process';
import { listDevices, startDevice } from '../../lib/ios/simulator.js';
import { detectFlutterProject, checkFlutterCli, waitForDevice } from '../../lib/flutter.js';
import { logger } from '../../utils/logger.js';

export async function appRunIos(id?: string): Promise<void> {
  const project = detectFlutterProject();
  if (!project) {
    logger.error('Not a Flutter project.');
    logger.info('Expected a pubspec.yaml with a flutter dependency in the current directory.');
    return;
  }

  const flutter = checkFlutterCli();
  if (!flutter.installed) {
    logger.error('Flutter CLI not found.');
    logger.info('Install Flutter: https://docs.flutter.dev/get-started/install');
    return;
  }

  const devices = listDevices();
  if (devices.length === 0) {
    logger.error('No iOS simulators available.');
    logger.info('Run: emuku create ios  — to set up iOS simulator prerequisites');
    return;
  }

  let target = id ? resolveDevice(devices, id) : pickDefault(devices);

  if (id && !target) {
    logger.error(`No iOS simulator found matching: "${id}"`);
    logger.info('Run: emuku ios device list  — to see available simulators');
    return;
  }

  if (!target) {
    logger.error('No iOS simulators available.');
    return;
  }

  if (target.state !== 'Booted') {
    logger.info(`Booting ${target.name}...`);
    const boot = startDevice(target.udid);
    if (!boot.success && !boot.alreadyBooted) {
      logger.error(`Failed to boot simulator: ${boot.error}`);
      return;
    }
    logger.info('Waiting for simulator to boot...');
    const booted = await waitForDevice(() => {
      const refreshed = listDevices().find(d => d.udid === target!.udid);
      return refreshed?.state === 'Booted' ? refreshed.udid : null;
    }, 60000);
    if (!booted) {
      logger.error('Simulator did not boot within 60 seconds.');
      return;
    }
  }

  logger.info(`Running Flutter on: ${target.name} (${target.runtime})`);
  logger.info(`Project: ${project.projectName}`);
  console.log();

  await runFlutter(['run', '-d', target.udid]);
}

function resolveDevice(devices: ReturnType<typeof listDevices>, query: string) {
  return (
    devices.find(d => d.udid === query) ??
    devices.find(d => d.name.toLowerCase() === query.toLowerCase()) ??
    devices.find(d => d.name.toLowerCase().includes(query.toLowerCase())) ??
    null
  );
}

function pickDefault(devices: ReturnType<typeof listDevices>) {
  return (
    devices.find(d => d.state === 'Booted') ??
    devices.find(d => d.isAvailable) ??
    null
  );
}

async function runFlutter(args: string[]): Promise<void> {
  return new Promise((resolve) => {
    const child = spawn('flutter', args, { stdio: 'inherit', cwd: process.cwd() });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        logger.error('flutter command not found. Ensure Flutter is in your PATH.');
      } else {
        logger.error(`flutter error: ${err.message}`);
      }
      resolve();
    });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log();
        logger.error(`Flutter exited with code ${code}`);
        logger.info('Common causes:');
        logger.info('  • Run: flutter pub get  (missing dependencies)');
        logger.info('  • Run: flutter doctor    (check environment)');
      }
      resolve();
    });
  });
}
