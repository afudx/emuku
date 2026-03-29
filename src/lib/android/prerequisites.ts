import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import enquirer from 'enquirer';
import { exec, resolveAndroidTool, commandExists } from '../shell.js';
import { logger } from '../../utils/logger.js';
import type { PrerequisiteCheck } from '../../types/prerequisite.js';

const { prompt } = enquirer;

export function checkPrerequisites(): PrerequisiteCheck[] {
  const checks: PrerequisiteCheck[] = [];

  const javaResult = exec('java -version');
  const javaInstalled = javaResult.exitCode === 0;
  let javaVersion: string | undefined;
  if (javaInstalled) {
    const match = (javaResult.stderr || javaResult.stdout).match(/version "([^"]+)"/);
    javaVersion = match?.[1];
  }
  checks.push({
    name: 'Java JDK',
    description: 'Required for Android development',
    installed: javaInstalled,
    version: javaVersion,
    fixCommand: 'brew install openjdk',
    fixInstructions: 'Install via Homebrew: brew install openjdk',
  });

  const androidHome = process.env['ANDROID_HOME'] ?? process.env['ANDROID_SDK_ROOT'];
  const sdkPathCandidates = [
    androidHome,
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
  ].filter(Boolean) as string[];
  const sdkRoot = sdkPathCandidates.find(p => existsSync(p));
  const androidHomeSet = !!androidHome;

  checks.push({
    name: 'ANDROID_HOME',
    description: 'Android SDK root environment variable',
    installed: androidHomeSet,
    version: androidHome,
    fixInstructions: `Add to your shell profile: export ANDROID_HOME=~/Library/Android/sdk`,
  });

  const sdkExists = !!sdkRoot;
  checks.push({
    name: 'Android SDK',
    description: 'Android SDK directory',
    installed: sdkExists,
    version: sdkRoot,
    fixInstructions: 'Install Android Studio from https://developer.android.com/studio or use sdkmanager',
  });

  const adbPath = resolveAndroidTool('adb');
  checks.push({
    name: 'ADB (platform-tools)',
    description: 'Android Debug Bridge',
    installed: !!adbPath,
    version: adbPath ?? undefined,
    fixInstructions: 'Install via sdkmanager: sdkmanager "platform-tools"',
  });

  const emulatorPath = resolveAndroidTool('emulator');
  checks.push({
    name: 'Android Emulator',
    description: 'Emulator binary',
    installed: !!emulatorPath,
    version: emulatorPath ?? undefined,
    fixInstructions: 'Install via sdkmanager: sdkmanager "emulator"',
  });

  const sdkmanagerPath = resolveAndroidTool('sdkmanager');
  let systemImageInstalled = false;
  let systemImageVersion: string | undefined;
  if (sdkmanagerPath) {
    const listResult = exec(`"${sdkmanagerPath}" --list_installed`);
    if (listResult.exitCode === 0 && listResult.stdout.includes('system-images')) {
      systemImageInstalled = true;
      const match = listResult.stdout.match(/system-images;([^\s|]+)/);
      systemImageVersion = match?.[1];
    }
  }
  checks.push({
    name: 'System Image',
    description: 'Android system image for emulator',
    installed: systemImageInstalled,
    version: systemImageVersion,
    fixInstructions: 'Install via sdkmanager: sdkmanager "system-images;android-34;google_apis;x86_64"',
  });

  let avdInstalled = false;
  let avdVersion: string | undefined;
  if (emulatorPath) {
    const avdResult = exec(`"${emulatorPath}" -list-avds`);
    const avds = avdResult.stdout.split('\n').map(l => l.trim()).filter(Boolean);
    avdInstalled = avds.length > 0;
    avdVersion = avdInstalled ? avds.join(', ') : undefined;
  }
  checks.push({
    name: 'Android Virtual Device (AVD)',
    description: 'At least one AVD created',
    installed: avdInstalled,
    version: avdVersion,
    fixInstructions: 'Create via: avdmanager create avd -n MyAVD -k "system-images;android-34;google_apis;x86_64"',
  });

  return checks;
}

export async function installMissing(missing: PrerequisiteCheck[]): Promise<void> {
  for (const item of missing) {
    console.log();

    if (item.name === 'ANDROID_HOME') {
      logger.info(`Set ANDROID_HOME in your shell profile:`);
      logger.info(`  export ANDROID_HOME=~/Library/Android/sdk`);
      logger.info(`  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator`);
      logger.info('Then restart your terminal or run: source ~/.zshrc (or ~/.bashrc)');
      continue;
    }

    if (item.name === 'Android SDK' || item.name === 'System Image') {
      logger.info(`${item.name}: ${item.fixInstructions}`);
      continue;
    }

    if (item.name === 'Android Virtual Device (AVD)') {
      await guideAvdCreation();
      continue;
    }

    if (item.fixCommand) {
      const isBrew = item.fixCommand.startsWith('brew');
      if (isBrew && !commandExists('brew')) {
        logger.warn('Homebrew not found. Install from https://brew.sh first.');
        continue;
      }

      const response = await prompt<{ confirm: boolean }>({
        type: 'confirm',
        name: 'confirm',
        message: `Install "${item.name}"? Will run: ${item.fixCommand}`,
        initial: true,
      });

      if (response.confirm) {
        logger.info(`Running: ${item.fixCommand}`);
        const result = exec(item.fixCommand);
        if (result.exitCode === 0) {
          logger.success(`${item.name} installed.`);
        } else {
          logger.error(`Failed: ${result.stderr || result.stdout}`);
        }
      }
    } else if (item.fixInstructions) {
      logger.info(`${item.name}: ${item.fixInstructions}`);
    }
  }
}

async function guideAvdCreation(): Promise<void> {
  const sdkmanagerPath = resolveAndroidTool('sdkmanager');
  if (!sdkmanagerPath) {
    logger.warn('sdkmanager not found. Cannot auto-create AVD.');
    logger.info('Install sdkmanager via Android Studio or command-line tools.');
    return;
  }

  const defaultImage = 'system-images;android-34;google_apis;x86_64';

  const imageResponse = await prompt<{ image: string }>({
    type: 'input',
    name: 'image',
    message: 'System image to use for AVD:',
    initial: defaultImage,
  });

  const nameResponse = await prompt<{ name: string }>({
    type: 'input',
    name: 'name',
    message: 'AVD name:',
    initial: 'Pixel_6_API_34',
  });

  const confirmResponse = await prompt<{ confirm: boolean }>({
    type: 'confirm',
    name: 'confirm',
    message: `Create AVD "${nameResponse.name}" using "${imageResponse.image}"?`,
    initial: true,
  });

  if (!confirmResponse.confirm) return;

  logger.info(`Installing system image: ${imageResponse.image}`);
  const installResult = exec(`"${sdkmanagerPath}" "${imageResponse.image}"`);
  if (installResult.exitCode !== 0) {
    logger.error(`Failed to install system image: ${installResult.stderr}`);
    return;
  }

  const avdmanager = sdkmanagerPath.replace('sdkmanager', 'avdmanager');
  const createResult = exec(`"${avdmanager}" create avd -n "${nameResponse.name}" -k "${imageResponse.image}" --force`);
  if (createResult.exitCode === 0) {
    logger.success(`AVD "${nameResponse.name}" created successfully.`);
  } else {
    logger.error(`Failed to create AVD: ${createResult.stderr || createResult.stdout}`);
    logger.info(`Manual command: avdmanager create avd -n "${nameResponse.name}" -k "${imageResponse.image}"`);
  }
}
