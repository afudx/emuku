import { exec } from '../shell.js';
import type { IOSDevice } from '../../types/device.js';

interface SimctlDevice {
  udid: string;
  name: string;
  state: string;
  isAvailable: boolean;
  deviceTypeIdentifier: string;
  lastBootedAt?: string;
}

interface SimctlOutput {
  devices: Record<string, SimctlDevice[]>;
}

export function listDevices(): IOSDevice[] {
  const result = exec('xcrun simctl list devices -j');
  if (result.exitCode !== 0) return [];

  let parsed: SimctlOutput;
  try {
    parsed = JSON.parse(result.stdout) as SimctlOutput;
  } catch {
    return [];
  }

  const devices: IOSDevice[] = [];

  for (const [runtimeId, devList] of Object.entries(parsed.devices)) {
    const runtime = runtimeIdToLabel(runtimeId);
    for (const dev of devList) {
      if (!dev.isAvailable) continue;
      devices.push({
        udid: dev.udid,
        name: dev.name,
        state: dev.state === 'Booted' ? 'Booted' : 'Shutdown',
        isAvailable: dev.isAvailable,
        runtime,
        runtimeId,
        deviceType: deviceTypeLabel(dev.deviceTypeIdentifier),
      });
    }
  }

  return devices.sort((a, b) => {
    if (a.state !== b.state) return a.state === 'Booted' ? -1 : 1;
    if (a.runtime !== b.runtime) return b.runtime.localeCompare(a.runtime);
    return a.name.localeCompare(b.name);
  });
}

export function startDevice(udid: string): { success: boolean; alreadyBooted: boolean; error?: string } {
  const devices = listDevices();
  const device = devices.find(d => d.udid === udid);

  if (!device) {
    return { success: false, alreadyBooted: false, error: `Device not found: ${udid}` };
  }

  if (device.state === 'Booted') {
    return { success: true, alreadyBooted: true };
  }

  const bootResult = exec(`xcrun simctl boot ${udid}`);
  if (bootResult.exitCode !== 0 && bootResult.exitCode !== 149) {
    return { success: false, alreadyBooted: false, error: bootResult.stderr || bootResult.stdout };
  }

  exec('open -a Simulator');
  return { success: true, alreadyBooted: false };
}

export function stopDevice(udid: string): { success: boolean; error?: string } {
  const devices = listDevices();
  const device = devices.find(d => d.udid === udid);

  if (!device) {
    return { success: false, error: `Device not found: ${udid}` };
  }

  if (device.state !== 'Booted') {
    return { success: true }; // Already stopped
  }

  const result = exec(`xcrun simctl shutdown ${udid}`);
  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr || result.stdout };
  }

  return { success: true };
}

export function findDevice(query: string): IOSDevice | null {
  const devices = listDevices();
  const byUdid = devices.find(d => d.udid === query);
  if (byUdid) return byUdid;
  const lower = query.toLowerCase();
  return devices.find(d => d.name.toLowerCase().includes(lower)) ?? null;
}

function runtimeIdToLabel(runtimeId: string): string {
  const match = runtimeId.match(/\.(\w+)-(\d+(?:-\d+)+)$/);
  if (!match) return runtimeId;
  const platform = match[1]!;
  const version = match[2]!.replace(/-/g, '.');
  return `${platform} ${version}`;
}

function deviceTypeLabel(identifier: string): string {
  const parts = identifier.split('.');
  const last = parts[parts.length - 1] ?? identifier;
  return last.replace(/-/g, ' ');
}
