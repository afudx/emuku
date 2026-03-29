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

type Nav = 'back' | 'home' | 'exit';

let sepId = 0;
function SEP() {
  return { role: 'heading', name: `__sep_${sepId++}`, message: ' ' };
}

function item(name: string, icon: string, label: string, desc: string) {
  return { name, message: `${icon}  ${label.padEnd(22)} ${c.dim(desc)}` };
}

function navItems() {
  return [
    SEP(),
    SEP(),
    { name: 'back', message: '←   Back' },
    { name: 'home', message: '⌂   Home' },
    { name: 'exit', message: '✕   Exit' },
  ] as const;
}

const ASCII_TITLE = `
  ███████╗███╗   ███╗██╗   ██╗██╗  ██╗██╗   ██╗
  ██╔════╝████╗ ████║██║   ██║██║ ██╔╝██║   ██║
  █████╗  ██╔████╔██║██║   ██║█████╔╝ ██║   ██║
  ██╔══╝  ██║╚██╔╝██║██║   ██║██╔═██╗ ██║   ██║
  ███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██╗╚██████╔╝
  ╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
`;

function getHeader(subtitle?: string): string {
  const iosBooted = listIosDevices().filter(d => d.state === 'Booted').length;
  const androidRunning = listAndroidDevices().filter(d => d.state === 'Running').length;
  const total = iosBooted + androidRunning;

  let hdr = c.cyan(ASCII_TITLE) + '\n';
  hdr += c.dim(`  cwd: ${process.cwd()}`) + '\n';
  hdr += c.dim(`  status: ${total} devices running, ${androidRunning} Android, ${iosBooted} iOS`) + '\n\n';

  if (subtitle) {
    hdr += c.bold.cyan(`  ${subtitle}`) + '\n\n';
  }

  return hdr;
}

async function selectMenu(message: string, choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string } | { name: string; message: string; disabled: boolean }>, cancelAction: string = 'exit', subtitle?: string): Promise<string> {
  let poller: NodeJS.Timeout | null = null;
  try {
    const SelectPrompt = (enquirer as any).Select;
    const promptInstance = new SelectPrompt({
      name: 'action',
      message,
      choices: choices as Array<{ name: string; message: string }>,
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

  console.clear();
  while (true) {
    const choice = await selectMenu('Select a category', [
      item('ios',     '○', 'iOS',       'Manage iOS simulators'),
      item('android', '△', 'Android',   'Manage Android emulators'),
      item('runtime', '◇', 'Runtime',   'Run Flutter apps & status'),
      item('setup',   '⚙', 'Setup',     'Prerequisites & installation'),
      item('utility', '⊞', 'Utility',   'Tools & shell completions'),
      SEP(),
      SEP(),
      { name: 'exit', message: '✕   Exit' },
    ]);

    if (choice === 'exit') {
      console.log();
      console.log(c.dim('Bye 👋'));
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
        console.log();
        console.log(c.dim('Bye 👋'));
        return;
      }
    }
  }
}

async function iosMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu('Select an action', [
      item('device-list',   '≡', 'Device List',   'List all simulators'),
      item('device-start',  '▶', 'Device Start',  'Boot a simulator'),
      item('device-stop',   '■', 'Device Stop',   'Shutdown a simulator'),
      item('device-status', '◉', 'Device Status',  'Show running simulators'),
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
      console.log();
      await action();
      console.log();
      await pause();
    }
  }
}

async function androidMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu('Select an action', [
      item('device-list',   '≡', 'Device List',   'List all emulators'),
      item('device-start',  '▶', 'Device Start',  'Boot an emulator'),
      item('device-stop',   '■', 'Device Stop',   'Shutdown an emulator'),
      item('device-status', '◉', 'Device Status',  'Show running emulators'),
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
    const choice = await selectMenu('Select an action', [
      item('run-ios',     '▶', 'Run iOS',      'Run Flutter on iOS simulator'),
      item('run-android', '▶', 'Run Android',  'Run Flutter on Android emulator'),
      item('status',      '◉', 'Status',       'Show all running devices'),
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
    const choice = await selectMenu('Select an action', [
      item('setup-ios',     '↧', 'Setup iOS',     'Check & install iOS prerequisites'),
      item('setup-android', '↧', 'Setup Android', 'Check & install Android prerequisites'),
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
    const choice = await selectMenu('Select an action', [
      item('bash-completion', '↳', 'Bash Completion', 'Install shell completions'),
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
  console.log();
  try {
    await action();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg !== '' && msg !== 'undefined' && e !== undefined) {
      console.error(c.red(`Error: ${msg}`));
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
