import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export function exec(cmd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: (e.stdout ?? '').toString().trim(),
      stderr: (e.stderr ?? '').toString().trim(),
      exitCode: e.status ?? 1,
    };
  }
}

export function spawnDetached(cmd: string, args: string[]): void {
  const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

export function commandExists(cmd: string): boolean {
  return exec(`which ${cmd}`).exitCode === 0;
}

export function resolveAndroidTool(tool: 'emulator' | 'adb' | 'sdkmanager'): string | null {
  const subpaths: Record<string, string> = {
    emulator: join('emulator', 'emulator'),
    adb: join('platform-tools', 'adb'),
    sdkmanager: join('cmdline-tools', 'latest', 'bin', 'sdkmanager'),
  };
  const subpath = subpaths[tool]!;

  const sdkRoots = [
    process.env['ANDROID_HOME'],
    process.env['ANDROID_SDK_ROOT'],
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
  ].filter(Boolean) as string[];

  for (const root of sdkRoots) {
    const fullPath = join(root, subpath);
    if (existsSync(fullPath)) return fullPath;
  }

  const fromPath = exec(`which ${tool}`);
  if (fromPath.exitCode === 0) return fromPath.stdout;

  return null;
}
