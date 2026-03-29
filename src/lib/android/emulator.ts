import { exec, spawnDetached, resolveAndroidTool } from '../shell.js';
import type { AndroidDevice } from '../../types/device.js';

export function listDevices(): AndroidDevice[] {
  const emulatorPath = resolveAndroidTool('emulator');
  if (!emulatorPath) return [];

  const avdResult = exec(`"${emulatorPath}" -list-avds`);
  const avdNames = avdResult.stdout
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('INFO') && !l.startsWith('WARNING'));

  const runningPorts = getRunningEmulatorPorts();
  const portToAvd = mapPortsToAvdNames(runningPorts);

  return avdNames.map(avdName => {
    const port = Object.entries(portToAvd).find(([, name]) => name === avdName)?.[0];
    return {
      avdName,
      state: port ? 'Running' : 'Stopped',
      port: port ? parseInt(port, 10) : undefined,
    };
  });
}

export function startDevice(avdName: string): { success: boolean; error?: string } {
  const emulatorPath = resolveAndroidTool('emulator');
  if (!emulatorPath) {
    return { success: false, error: 'Android emulator not found. Run: emuku create android' };
  }

  const devices = listDevices();
  if (!devices.find(d => d.avdName === avdName)) {
    return { success: false, error: `AVD not found: ${avdName}` };
  }

  spawnDetached(emulatorPath, [`@${avdName}`]);
  return { success: true };
}

export function stopDevice(avdName: string): { success: boolean; error?: string } {
  const adbPath = resolveAndroidTool('adb');
  if (!adbPath) {
    return { success: false, error: 'Android adb not found. Run: emuku create android' };
  }

  const devices = listDevices();
  const device = devices.find(d => d.avdName === avdName);

  if (!device) {
    return { success: false, error: `AVD not found: ${avdName}` };
  }

  if (device.state !== 'Running' || !device.port) {
    return { success: true }; // Already stopped
  }

  const result = exec(`"${adbPath}" -s emulator-${device.port} emu kill`);
  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr || result.stdout };
  }

  return { success: true };
}

export function findDevice(query: string): AndroidDevice | null {
  const devices = listDevices();
  const lower = query.toLowerCase();
  return devices.find(d => d.avdName.toLowerCase() === lower || d.avdName.toLowerCase().includes(lower)) ?? null;
}

function getRunningEmulatorPorts(): string[] {
  const adbPath = resolveAndroidTool('adb');
  if (!adbPath) return [];

  const result = exec(`"${adbPath}" devices`);
  const ports: string[] = [];

  for (const line of result.stdout.split('\n')) {
    const match = line.match(/^emulator-(\d+)\s+device$/);
    if (match) ports.push(match[1]!);
  }

  return ports;
}

function mapPortsToAvdNames(ports: string[]): Record<string, string> {
  const adbPath = resolveAndroidTool('adb');
  if (!adbPath) return {};

  const map: Record<string, string> = {};

  for (const port of ports) {
    const result = exec(`"${adbPath}" -s emulator-${port} emu avd name`);
    if (result.exitCode === 0) {
      const name = result.stdout.split('\n')[0]?.trim();
      if (name) map[port] = name;
    }
  }

  return map;
}
