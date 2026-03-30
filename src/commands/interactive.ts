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

const PAD = '  ';
const ORANGE = '\x1b[38;2;249;115;22m';
const BG_ORANGE = '\x1b[48;2;249;115;22m';
const DARK_BG = '\x1b[38;2;32;38;43m';
const RST = '\x1b[0m';

function accent(str: string): string {
  return `${ORANGE}${str}${RST}`;
}
function accentBold(str: string): string {
  return `\x1b[1m${ORANGE}${str}${RST}`;
}
function accentInverse(str: string): string {
  return `\x1b[1m${BG_ORANGE}${DARK_BG}${str}${RST}`;
}

type Nav = 'back' | 'home' | 'exit';

const CATEGORIES = ['iOS', 'Android', 'Runtime', 'Setup', 'Utility'] as const;

let sepId = 0;
function SEP() {
  return { role: 'heading', name: `__sep_${sepId++}`, message: ' ' };
}

function item(name: string, icon: string, label: string) {
  return { name, message: `${accent(icon)}  ${label}` };
}

function navItems() {
  return [
    SEP(),
    { name: 'back', message: `${accent('←')}  Back` },
    { name: 'home', message: `${accent('⌂')}  Home` },
    { name: 'exit', message: `${accent('✕')}  Exit` },
  ] as const;
}

function cols(): number {
  return process.stdout.columns || 80;
}

function boxWidth(): number {
  return Math.min(cols() - 4, 70);
}

const ASCII_TITLE = [
  '███████╗███╗   ███╗██╗   ██╗██╗  ██╗██╗   ██╗',
  '██╔════╝████╗ ████║██║   ██║██║ ██╔╝██║   ██║',
  '█████╗  ██╔████╔██║██║   ██║█████╔╝ ██║   ██║',
  '██╔══╝  ██║╚██╔╝██║██║   ██║██╔═██╗ ██║   ██║',
  '███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██╗╚██████╔╝',
  '╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝',
];

function renderTitle(): string {
  return ASCII_TITLE.map(l => PAD + accent(l)).join('\n');
}

function renderTabs(active?: string): string {
  const tabs = CATEGORIES.map(cat => {
    if (active && cat === active) {
      return `${c.dim('[')} ${accentInverse(` ${cat} `)} ${c.dim(']')}`;
    }
    return `${c.dim('[')} ${c.white(cat)} ${c.dim(']')}`;
  });
  return PAD + tabs.join('  ');
}

function boxTop(title: string): string {
  const w = boxWidth();
  const titleStr = ` ${title} `;
  const lineLen = w - 2 - titleStr.length;
  const line = '─'.repeat(Math.max(lineLen, 2));
  return PAD + accent('┌─') + accentBold(titleStr) + accent(line + '┐');
}

function boxBottom(): string {
  const w = boxWidth();
  return PAD + accent('└' + '─'.repeat(w - 2) + '┘');
}

function boxRow(content: string): string {
  return PAD + accent('│') + ' ' + content;
}

function renderStatusFooter(): string {
  const iosBooted = listIosDevices().filter(d => d.state === 'Booted').length;
  const androidRunning = listAndroidDevices().filter(d => d.state === 'Running').length;
  const total = iosBooted + androidRunning;

  const lines = [
    boxTop('Device Status'),
    boxRow(`${total} devices running, ${androidRunning} android, ${iosBooted} iOS`),
    boxRow(c.dim(process.cwd())),
    boxBottom(),
  ];
  return lines.join('\n');
}

function getHeader(activeTab?: string, panelTitle?: string): string {
  const parts = [
    '',
    renderTitle(),
    '',
    renderTabs(activeTab),
    '',
    boxTop(panelTitle || 'Menu'),
    boxRow(''),
  ];
  return parts.join('\n');
}

function getFooter(): string {
  const parts = [
    boxRow(''),
    boxBottom(),
    '',
    renderStatusFooter(),
  ];
  return parts.join('\n');
}

async function selectMenu(
  choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string }>,
  cancelAction: string = 'exit',
  activeTab?: string,
  panelTitle?: string,
): Promise<string> {
  process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
  try {
    const SelectPrompt = (enquirer as any).Select;
    const promptInstance = new SelectPrompt({
      name: 'action',
      message: ' ',
      choices: choices as Array<{ name: string; message: string }>,
      prefix: PAD,
      margin: [0, 0, 0, PAD.length + 3],
    });

    promptInstance.options.header = getHeader(activeTab, panelTitle);
    promptInstance.options.footer = () => getFooter();
    promptInstance.separator = () => '';
    promptInstance.styles.highlight = (str: string) => accent(str);
    promptInstance.styles.em = (str: string) => accent(str);

    const response = await promptInstance.run();
    return response;
  } catch {
    return cancelAction;
  }
}

function exitAltScreen(): void {
  process.stdout.write('\x1b[?1049l');
}

export async function startInteractive(): Promise<void> {
  if (!process.stdin.isTTY) {
    return help();
  }

  process.stdout.write('\x1b[?1049h');

  try {
    while (true) {
      const choice = await selectMenu([
        item('ios',     '○', 'iOS'),
        item('android', '△', 'Android'),
        item('runtime', '◇', 'Runtime'),
        item('setup',   '⚙', 'Setup'),
        item('utility', '⊞', 'Utility'),
        SEP(),
        { name: 'exit', message: `${accent('✕')}  Exit` },
      ], 'exit', undefined, 'Main Menu');

      if (choice === 'exit') {
        exitAltScreen();
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
          exitAltScreen();
          return;
        }
      }
    }
  } catch {
    exitAltScreen();
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
    ], 'back', 'iOS', 'iOS Management');

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
    ], 'back', 'Android', 'Android Management');

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
      { name: 'run-ios',     message: `${accent('▶')}  Run in iOS Simulator       ${c.dim('run flutter app in cwd in iOS')}` },
      { name: 'run-android', message: `${accent('▶')}  Run in Android Emulator    ${c.dim('run flutter app in cwd in Android')}` },
      item('status',      '◉', 'Status'),
      ...navItems(),
    ], 'back', 'Runtime', 'Runtime Management');

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
    ], 'back', 'Setup', 'Setup');

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
    ], 'back', 'Utility', 'Utility');

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
  process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
  let cancelled = false;
  try {
    await action();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === '' || msg === 'undefined' || e === undefined) {
      cancelled = true;
    } else {
      console.error(c.red(`${PAD}Error: ${msg}`));
    }
  }
  if (!cancelled) {
    console.log();
    console.log(c.dim(`${PAD}Press any key to continue...`));
    await waitForKey();
  }
}

function waitForKey(): Promise<void> {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once('data', () => {
      stdin.setRawMode(wasRaw);
      resolve();
    });
  });
}
