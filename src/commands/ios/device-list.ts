import { listDevices } from '../../lib/ios/simulator.js';
import { tableLines, statusBadge } from '../../utils/display.js';
import c from 'ansi-colors';

export async function iosDeviceList(): Promise<string[] | void> {
  const devices = listDevices();

  if (devices.length === 0) {
    return [
      c.yellow('⚠ No iOS simulators found.'),
      c.cyan('ℹ Run: emuku create ios  — to set up iOS simulator prerequisites')
    ];
  }

  const byRuntime = new Map<string, typeof devices>();
  for (const d of devices) {
    const list = byRuntime.get(d.runtime) ?? [];
    list.push(d);
    byRuntime.set(d.runtime, list);
  }

  const runtimes = [...byRuntime.keys()].sort((a, b) => b.localeCompare(a));
  const lines: string[] = [];

  for (const runtime of runtimes) {
    lines.push('');
    lines.push(`  ${c.bold(runtime)}`);
    const rows = byRuntime.get(runtime)!.map(d => [
      d.name,
      d.udid,
      statusBadge(d.state),
    ]);
    lines.push(...tableLines(['Name', 'UDID', 'State'], rows));
  }

  lines.push('');
  return lines;
}
