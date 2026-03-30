import { listDevices } from '../../lib/android/emulator.js';
import { tableLines, statusBadge } from '../../utils/display.js';
import c from 'ansi-colors';

export async function androidDeviceList(): Promise<string[] | void> {
  const devices = listDevices();

  if (devices.length === 0) {
    return [
      c.yellow('⚠ No Android emulators found.'),
      c.cyan('ℹ Run: emuku create android  — to set up Android emulator prerequisites')
    ];
  }

  const lines: string[] = [''];
  const rows = devices.map(d => [
    d.avdName,
    statusBadge(d.state),
    d.port ? String(d.port) : '—',
  ]);
  lines.push(...tableLines(['AVD Name', 'State', 'Port'], rows));
  lines.push('');
  return lines;
}
