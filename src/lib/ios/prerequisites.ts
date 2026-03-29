import enquirer from 'enquirer';
import { exec } from '../shell.js';
import { logger } from '../../utils/logger.js';
import type { PrerequisiteCheck } from '../../types/prerequisite.js';

const { prompt } = enquirer;

export function checkPrerequisites(): PrerequisiteCheck[] {
  const checks: PrerequisiteCheck[] = [];

  const isMac = process.platform === 'darwin';
  checks.push({
    name: 'macOS',
    description: 'iOS simulators require macOS',
    installed: isMac,
    version: isMac ? process.platform : undefined,
    fixInstructions: 'iOS simulators are only available on macOS',
  });

  if (!isMac) return checks;

  const xcodeCheck = exec('xcode-select -p');
  const xcodeInstalled = xcodeCheck.exitCode === 0 && xcodeCheck.stdout.length > 0;
  let xcodeVersion: string | undefined;
  if (xcodeInstalled) {
    const verResult = exec('xcodebuild -version');
    xcodeVersion = verResult.stdout.split('\n')[0] ?? undefined;
  }
  checks.push({
    name: 'Xcode',
    description: 'Xcode IDE (required for simulators)',
    installed: xcodeInstalled,
    version: xcodeVersion,
    fixInstructions: 'Install from App Store: https://apps.apple.com/app/xcode/id497799835',
  });

  const cliCheck = exec('xcode-select -p');
  const cliPath = cliCheck.stdout.trim();
  const cliInstalled = xcodeInstalled && cliPath.length > 0;
  checks.push({
    name: 'Xcode CLI Tools',
    description: 'Command line developer tools',
    installed: cliInstalled,
    version: cliInstalled ? cliPath : undefined,
    fixCommand: 'xcode-select --install',
    fixInstructions: 'Run: xcode-select --install',
  });

  const simctlCheck = exec('xcrun simctl help');
  const simctlInstalled = simctlCheck.exitCode === 0;
  checks.push({
    name: 'xcrun simctl',
    description: 'Simulator control tool',
    installed: simctlInstalled,
    fixInstructions: 'Install Xcode and CLI tools first',
  });

  let runtimesInstalled = false;
  let runtimeVersion: string | undefined;
  if (simctlInstalled) {
    const rtResult = exec('xcrun simctl list runtimes -j');
    if (rtResult.exitCode === 0) {
      try {
        const parsed = JSON.parse(rtResult.stdout) as { runtimes: Array<{ isAvailable: boolean; name: string }> };
        const available = parsed.runtimes.filter(r => r.isAvailable);
        runtimesInstalled = available.length > 0;
        if (runtimesInstalled) {
          runtimeVersion = available.map(r => r.name).join(', ');
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  checks.push({
    name: 'iOS Simulator Runtime',
    description: 'At least one iOS runtime installed',
    installed: runtimesInstalled,
    version: runtimeVersion,
    fixInstructions: 'Open Xcode > Settings > Platforms, or run: xcodebuild -downloadPlatform iOS',
  });

  return checks;
}

export async function installMissing(missing: PrerequisiteCheck[]): Promise<void> {
  for (const item of missing) {
    if (!item.fixCommand && !item.fixInstructions) continue;

    console.log();

    if (item.name === 'macOS') {
      logger.error('iOS simulators require macOS. Cannot continue on this platform.');
      return;
    }

    if (item.name === 'Xcode') {
      logger.info('Xcode must be installed from the App Store.');
      logger.info('Visit: https://apps.apple.com/app/xcode/id497799835');
      continue;
    }

    if (item.fixCommand) {
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
