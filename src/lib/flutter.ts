import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from './shell.js';

export interface FlutterProject {
  projectName: string;
  pubspecPath: string;
}

export interface FlutterCliInfo {
  installed: boolean;
  version?: string;
}

export function detectFlutterProject(dir: string = process.cwd()): FlutterProject | null {
  const pubspecPath = join(dir, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) return null;

  const content = readFileSync(pubspecPath, 'utf8');
  if (!content.includes('flutter:')) return null;

  const nameMatch = content.match(/^name:\s*(.+)$/m);
  const projectName = nameMatch?.[1]?.trim() ?? 'unknown';

  return { projectName, pubspecPath };
}

export function checkFlutterCli(): FlutterCliInfo {
  const result = exec('flutter --version');
  if (result.exitCode !== 0) return { installed: false };

  const versionMatch = result.stdout.match(/Flutter (\S+)/);
  return { installed: true, version: versionMatch?.[1] };
}

export async function waitForDevice(
  poll: () => string | null,
  timeoutMs: number = 90000,
  intervalMs: number = 3000,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const id = poll();
    if (id) return id;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}
