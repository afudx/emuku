import c from 'ansi-colors';
import enquirer from 'enquirer';
import { help } from './help.js';
import { iosDeviceList } from './ios/device-list.js';
import { iosDeviceStart } from './ios/device-start.js';
import { iosDeviceStop } from './ios/device-stop.js';
import { iosDeviceStatus } from './ios/device-status.js';
import { androidDeviceList } from './android/device-list.js';
import { androidDeviceStart } from './android/device-start.js';
import { androidDeviceStop } from './android/device-stop.js';
import { androidDeviceStatus } from './android/device-status.js';
import { appRunIos } from './app/run-ios.js';
import { appRunAndroid } from './app/run-android.js';
import { status } from './status.js';
import { createIos } from './create/ios.js';
import { createAndroid } from './create/android.js';
import { bashCompletion } from './tools/bash-completion.js';
import { listDevices as listIosDevices } from '../lib/ios/simulator.js';
import { listDevices as listAndroidDevices } from '../lib/android/emulator.js';
const { prompt } = enquirer;

const PAD = '    ';

type Nav = 'back' | 'home' | 'exit';

let sepId = 0;
function SEP() {
  return { role: 'heading', name: `__sep_${sepId++}`, message: ' ' };
}

function item(name: string, icon: string, label: string) {
  return { name, message: `${icon}  ${label}` };
}

function navItems() {
  return [
    SEP(),
    SEP(),
    { name: 'back', message: '←  Back' },
    { name: 'home', message: '⌂  Home' },
    { name: 'exit', message: '✕  Exit' },
  ] as const;
}

const ASCII_TITLE = [
  '███████╗███╗   ███╗██╗   ██╗██╗  ██╗██╗   ██╗',
  '██╔════╝████╗ ████║██║   ██║██║ ██╔╝██║   ██║',
  '█████╗  ██╔████╔██║██║   ██║█████╔╝ ██║   ██║',
  '██╔══╝  ██║╚██╔╝██║██║   ██║██╔═██╗ ██║   ██║',
  '███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██╗╚██████╔╝',
  '╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝',
].map(l => PAD + l).join('\n');

function getHeader(subtitle?: string): string {
  const iosBooted = listIosDevices().filter(d => d.state === 'Booted').length;
  const androidRunning = listAndroidDevices().filter(d => d.state === 'Running').length;
  const total = iosBooted + androidRunning;

  let hdr = '\n' + c.cyan(ASCII_TITLE) + '\n\n';
  hdr += c.dim(`${PAD}${process.cwd()}`) + '\n';
  hdr += c.dim(`${PAD}${total} devices running, ${androidRunning} android, ${iosBooted} iOS`) + '\n';

  if (subtitle) {
    hdr += '\n' + c.bold.cyan(`${PAD}${subtitle}`) + '\n';
  }

  return hdr;
}

async function selectMenu(
  choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string }>,
  cancelAction: string = 'exit',
  subtitle?: string,
): Promise<string> {
  console.clear();
  let poller: NodeJS.Timeout | null = null;
  try {
    const SelectPrompt = (enquirer as any).Select;
    const promptInstance = new SelectPrompt({
      name: 'action',
      message: ' ',
      choices: choices as Array<{ name: string; message: string }>,
      prefix: PAD,
    });

    promptInstance.options.header = getHeader(subtitle);

    poller = setInterval(() => {
      promptInstance.options.header = getHeader(subtitle);
      if (promptInstance.state.status === 'pending') {
        promptInstance.render();
      }
    }, 2000);
    poller.unref();

    const response = await promptInstance.run();
    if (poller) clearInterval(poller);
    return response;
  } catch {
    if (poller) clearInterval(poller);
    return cancelAction;
  }
}


export async function startInteractive(): Promise<void> {
  if (!process.stdin.isTTY) {
    return help();
  }

  while (true) {
    const choice = await selectMenu([
      item('ios',     '○', 'iOS'),
      item('android', '△', 'Android'),
      item('runtime', '◇', 'Runtime'),
      item('setup',   '⚙', 'Setup'),
      item('utility', '⊞', 'Utility'),
      SEP(),
      SEP(),
      { name: 'exit', message: '✕  Exit' },
    ]);

    if (choice === 'exit') {
      console.clear();
      return;
    }

    const handlers: Record<string, () => Promise<Nav>> = {
      ios: iosMenu,
      android: androidMenu,
      runtime: runtimeMenu,
      setup: setupMenu,
      utility: utilityMenu,
    };

    const handler = handlers[choice];
    if (handler) {
      const nav = await handler();
      if (nav === 'exit') {
        console.clear();
        return;
      }
    }
  }
}

async function iosMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('device-list',   '≡', 'Device List'),
      item('device-start',  '▶', 'Device Start'),
      item('device-stop',   '■', 'Device Stop'),
      item('device-status', '◉', 'Device Status'),
      ...navItems(),
    ], 'back', '○  iOS');

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'device-list': iosDeviceList,
      'device-start': () => iosDeviceStart(),
      'device-stop': () => iosDeviceStop(),
      'device-status': iosDeviceStatus,
    };

    const action = actions[choice];
    if (action) {
      await runAction(action);
    }
  }
}

async function androidMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('device-list',   '≡', 'Device List'),
      item('device-start',  '▶', 'Device Start'),
      item('device-stop',   '■', 'Device Stop'),
      item('device-status', '◉', 'Device Status'),
      ...navItems(),
    ], 'back', '△  Android');

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'device-list': androidDeviceList,
      'device-start': () => androidDeviceStart(),
      'device-stop': () => androidDeviceStop(),
      'device-status': androidDeviceStatus,
    };

    const action = actions[choice];
    if (action) {
      await runAction(action);
    }
  }
}

async function runtimeMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('run-ios',     '▶', 'Run iOS'),
      item('run-android', '▶', 'Run Android'),
      item('status',      '◉', 'Status'),
      ...navItems(),
    ], 'back', '◇  Runtime');

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'run-ios': () => appRunIos(),
      'run-android': () => appRunAndroid(),
      'status': status,
    };

    const action = actions[choice];
    if (action) {
      await runAction(action);
    }
  }
}

async function setupMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('setup-ios',     '↧', 'Setup iOS'),
      item('setup-android', '↧', 'Setup Android'),
      ...navItems(),
    ], 'back', '⚙  Setup');

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'setup-ios': createIos,
      'setup-android': createAndroid,
    };

    const action = actions[choice];
    if (action) {
      await runAction(action);
    }
  }
}

async function utilityMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('bash-completion', '↳', 'Bash Completion'),
      ...navItems(),
    ], 'back', '⊞  Utility');

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'bash-completion': bashCompletion,
    };

    const action = actions[choice];
    if (action) {
      await runAction(action);
    }
  }
}

async function runAction(action: () => Promise<void>): Promise<void> {
  console.clear();
  console.log();
  try {
    await action();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg !== '' && msg !== 'undefined' && e !== undefined) {
      console.error(c.red(`${PAD}Error: ${msg}`));
    }
  }
  console.log();
  await pause();
}

async function pause(): Promise<void> {
  try {
    await prompt<{ continue: boolean }>({
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to continue...',
      initial: true,
    });
  } catch {
    // Ignore Esc/Ctrl+C
  }
}
