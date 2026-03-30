import { help } from './commands/help.js';
import { startInteractive } from './commands/interactive.js';
import { iosHelp } from './commands/ios/help.js';
import { androidHelp } from './commands/android/help.js';
import { iosDeviceList } from './commands/ios/device-list.js';
import { iosDeviceStart } from './commands/ios/device-start.js';
import { androidDeviceList } from './commands/android/device-list.js';
import { androidDeviceStart } from './commands/android/device-start.js';
import { createIos } from './commands/create/ios.js';
import { createAndroid } from './commands/create/android.js';
import { bashCompletion } from './commands/tools/bash-completion.js';
import { appRunIos } from './commands/app/run-ios.js';
import { appRunAndroid } from './commands/app/run-android.js';
import { status } from './commands/status.js';
import { iosDeviceStatus } from './commands/ios/device-status.js';
import { androidDeviceStatus } from './commands/android/device-status.js';
import { iosDeviceStop } from './commands/ios/device-stop.js';
import { androidDeviceStop } from './commands/android/device-stop.js';

const args = process.argv.slice(2);

async function main(): Promise<void> {
  const [a0, a1, a2, a3] = args;

  if (args.length === 0) {
    return startInteractive();
  }

  if (a0 === '--help' || a0 === '-h') {
    return help();
  }

  if (a0 === 'status') {
    const res = await status();
    if (res) res.forEach(l => console.log(l));
    return;
  }

  if (a0 === 'ios') {
    if (!a1) return iosHelp();
    if (a1 === 'device' && a2 === 'list') { const r = await iosDeviceList(); if (r) r.forEach(l => console.log(l)); return; }
    if (a1 === 'device' && a2 === 'start') return iosDeviceStart(a3);
    if (a1 === 'device' && a2 === 'status') { const r = await iosDeviceStatus(); if (r) r.forEach(l => console.log(l)); return; }
    if (a1 === 'device' && a2 === 'stop') return iosDeviceStop(a3);
    return iosHelp();
  }

  if (a0 === 'android') {
    if (!a1) return androidHelp();
    if (a1 === 'device' && a2 === 'list') { const r = await androidDeviceList(); if (r) r.forEach(l => console.log(l)); return; }
    if (a1 === 'device' && a2 === 'start') return androidDeviceStart(a3);
    if (a1 === 'device' && a2 === 'status') { const r = await androidDeviceStatus(); if (r) r.forEach(l => console.log(l)); return; }
    if (a1 === 'device' && a2 === 'stop') return androidDeviceStop(a3);
    return androidHelp();
  }

  if (a0 === 'create') {
    if (a1 === 'ios') return createIos();
    if (a1 === 'android') return createAndroid();
  }

  if (a0 === 'tools' && a1 === 'bash-completion') {
    return bashCompletion();
  }

  if (a0 === 'app') {
    if (a1 === 'run' && a2 === 'ios') return appRunIos(a3);
    if (a1 === 'run' && a2 === 'android') return appRunAndroid(a3);
  }

  console.error(`Unknown command: ${args.join(' ')}\n`);
  return help();
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
