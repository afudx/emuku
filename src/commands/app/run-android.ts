import { spawn } from 'child_process';
import { listDevices, startDevice } from '../../lib/android/emulator.js';
import { detectFlutterProject, checkFlutterCli, waitForDevice } from '../../lib/flutter.js';
import { logger } from '../../utils/logger.js';

export async function appRunAndroid(id?: string): Promise<void> {
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
    logger.error('No Android emulators found.');
    logger.info('Run: emuku create android  — to set up Android emulator prerequisites');
    return;
  }

  const target = id ? resolveDevice(devices, id) : pickDefault(devices);

  if (id && !target) {
    logger.error(`No Android emulator found matching: "${id}"`);
    logger.info('Run: emuku android device list  — to see available emulators');
    return;
  }

  if (!target) {
    logger.error('No Android emulators available.');
    return;
  }

  let flutterDeviceId: string;

  if (target.state === 'Running' && target.port) {
    flutterDeviceId = `emulator-${target.port}`;
    logger.info(`Using running emulator: ${target.avdName} (${flutterDeviceId})`);
  } else {
    logger.info(`Starting emulator: ${target.avdName}...`);
    const startResult = startDevice(target.avdName);
    if (!startResult.success) {
      logger.error(`Failed to start emulator: ${startResult.error}`);
      return;
    }

    logger.info('Waiting for emulator to come online (up to 90s)...');
    const port = await waitForDevice(() => {
      const running = listDevices().find(
        d => d.avdName === target.avdName && d.state === 'Running' && d.port,
      );
      return running?.port ? `emulator-${running.port}` : null;
    }, 90000);

    if (!port) {
      logger.error('Emulator did not come online within 90 seconds.');
      logger.info('Try running the emulator manually and retry.');
      return;
    }

    flutterDeviceId = port;
    logger.success(`Emulator online: ${flutterDeviceId}`);
  }

  logger.info(`Running Flutter on: ${target.avdName} (${flutterDeviceId})`);
  logger.info(`Project: ${project.projectName}`);
  console.log();

  await runFlutter(['run', '-d', flutterDeviceId]);
}

function resolveDevice(devices: ReturnType<typeof listDevices>, query: string) {
  return (
    devices.find(d => d.avdName.toLowerCase() === query.toLowerCase()) ??
    devices.find(d => d.avdName.toLowerCase().includes(query.toLowerCase())) ??
    (query.startsWith('emulator-')
      ? devices.find(d => d.port === parseInt(query.replace('emulator-', ''), 10))
      : null) ??
    null
  );
}

function pickDefault(devices: ReturnType<typeof listDevices>) {
  return devices.find(d => d.state === 'Running') ?? devices[0] ?? null;
}

async function runFlutter(args: string[]): Promise<void> {
  return new Promise(resolve => {
    const child = spawn('flutter', args, { stdio: 'inherit', cwd: process.cwd() });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        logger.error('flutter command not found. Ensure Flutter is in your PATH.');
      } else {
        logger.error(`flutter error: ${err.message}`);
      }
      resolve();
    });

    child.on('close', code => {
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
