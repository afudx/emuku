import { help } from './commands/help.js';
import { iosHelp } from './commands/ios/help.js';
import { androidHelp } from './commands/android/help.js';
import { iosDeviceList } from './commands/ios/device-list.js';
import { iosDeviceStart } from './commands/ios/device-start.js';
import { androidDeviceList } from './commands/android/device-list.js';
import { androidDeviceStart } from './commands/android/device-start.js';
import { createIos } from './commands/create/ios.js';
import { createAndroid } from './commands/create/android.js';
import { bashCompletion } from './commands/tools/bash-completion.js';

const args = process.argv.slice(2);

async function main(): Promise<void> {
  const [a0, a1, a2, a3] = args;

  if (args.length === 0 || a0 === '--help' || a0 === '-h') {
    return help();
  }

  if (a0 === 'ios') {
    if (!a1) return iosHelp();
    if (a1 === 'device' && a2 === 'list') return iosDeviceList();
    if (a1 === 'device' && a2 === 'start') return iosDeviceStart(a3);
    return iosHelp();
  }

  if (a0 === 'android') {
    if (!a1) return androidHelp();
    if (a1 === 'device' && a2 === 'list') return androidDeviceList();
    if (a1 === 'device' && a2 === 'start') return androidDeviceStart(a3);
    return androidHelp();
  }

  if (a0 === 'create') {
    if (a1 === 'ios') return createIos();
    if (a1 === 'android') return createAndroid();
  }

  if (a0 === 'tools' && a1 === 'bash-completion') {
    return bashCompletion();
  }

  console.error(`Unknown command: ${args.join(' ')}\n`);
  return help();
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
