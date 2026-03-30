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
const DARK_FG = '\x1b[38;2;32;38;43m';
const RST = '\x1b[0m';
const BOLD = '\x1b[1m';

function accent(str: string): string { return `${ORANGE}${str}${RST}`; }
function accentBold(str: string): string { return `${BOLD}${ORANGE}${str}${RST}`; }
function accentInverse(str: string): string { return `${BOLD}${BG_ORANGE}${DARK_FG}${str}${RST}`; }

function visLen(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padEnd(str: string, width: number): string {
  const diff = width - visLen(str);
  return diff > 0 ? str + ' '.repeat(diff) : str;
}

type Nav = 'back' | 'home' | 'exit';

const CATEGORIES = ['iOS', 'Android', 'Runtime', 'Setup', 'Utility'] as const;

let sepId = 0;
function SEP() { return { role: 'heading', name: `__sep_${sepId++}`, message: ' ' }; }

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

function totalWidth(): number { return process.stdout.columns || 80; }
function leftWidth(): number { return Math.max(Math.floor((totalWidth() - 4) / 4), 24); }
function rightWidth(): number { return totalWidth() - 4 - leftWidth() - 1; }

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

function boxTopLine(title: string, width: number): string {
  const titleStr = ` ${title} `;
  const lineLen = Math.max(width - 2 - titleStr.length, 2);
  return accent('┌─') + accentBold(titleStr) + accent('─'.repeat(lineLen) + '┐');
}

function boxBottomLine(width: number): string {
  return accent('└' + '─'.repeat(width - 2) + '┘');
}

function boxMidLine(content: string, width: number): string {
  const inner = width - 4;
  return accent('│') + ' ' + padEnd(content, inner) + ' ' + accent('│');
}

function boxEmptyLine(width: number): string {
  return accent('│') + ' '.repeat(width - 2) + accent('│');
}

const SUBMENU_PREVIEW: Record<string, string[]> = {
  ios:     ['≡  Device List', '▶  Device Start', '■  Device Stop', '◉  Device Status'],
  android: ['≡  Device List', '▶  Device Start', '■  Device Stop', '◉  Device Status'],
  runtime: ['▶  Run in iOS Simulator', '▶  Run in Android Emulator', '◉  Status'],
  setup:   ['↧  Setup iOS', '↧  Setup Android'],
  utility: ['↳  Bash Completion'],
  exit:    [],
};

function buildRightPanel(title: string, lines: string[], height: number): string[] {
  const rw = rightWidth();
  const result: string[] = [];
  result.push(boxTopLine(title, rw));
  for (let i = 0; i < height; i++) {
    if (i < lines.length) {
      result.push(boxMidLine(lines[i], rw));
    } else {
      result.push(boxEmptyLine(rw));
    }
  }
  result.push(boxBottomLine(rw));
  return result;
}

function buildDeviceStatusLines(): string[] {
  const iosBooted = listIosDevices().filter(d => d.state === 'Booted').length;
  const androidRunning = listAndroidDevices().filter(d => d.state === 'Running').length;
  const total = iosBooted + androidRunning;
  const lines = [
    `${total} devices running`,
    `${androidRunning} android, ${iosBooted} iOS`,
    '',
    c.dim(process.cwd()),
  ];
  return lines;
}

interface PanelConfig {
  activeTab?: string;
  leftTitle: string;
  rightTitle: string;
  rightContentFn: (focusedName?: string) => string[];
}

async function selectMenu(
  choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string }>,
  cancelAction: string = 'exit',
  panel: PanelConfig,
): Promise<string> {
  process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
  try {
    const SelectPrompt = (enquirer as any).Select;
    const lw = leftWidth();
    const promptInstance = new SelectPrompt({
      name: 'action',
      message: ' ',
      choices: choices as Array<{ name: string; message: string }>,
      prefix: PAD,
      margin: [0, 0, 0, PAD.length + 1],
    });

    promptInstance.separator = () => '';
    promptInstance.styles.highlight = (str: string) => accent(str);
    promptInstance.styles.em = (str: string) => accent(str);

    const origRenderChoices = promptInstance.renderChoices.bind(promptInstance);
    promptInstance.renderChoices = async function () {
      const rendered: string = await origRenderChoices();
      if (this.state.submitted) return rendered;

      const leftLines = rendered.split('\n');
      const focusedChoice = this.choices?.[this.index];
      const focusedName = focusedChoice?.name || '';

      const rightContent = panel.rightContentFn(focusedName);
      const rightPanel = buildRightPanel(panel.rightTitle, rightContent, leftLines.length);

      const combined = leftLines.map((line: string, i: number) => {
        const paddedLeft = padEnd(line, lw);
        const rightLine = i < rightPanel.length - 2 ? rightPanel[i + 1] : boxEmptyLine(rightWidth());
        return paddedLeft + ' ' + rightLine;
      });

      return combined.join('\n');
    };

    const headerParts = [
      '',
      renderTitle(),
      '',
      renderTabs(panel.activeTab),
      '',
      PAD + boxTopLine(panel.leftTitle, lw) + ' ' + buildRightPanel(panel.rightTitle, panel.rightContentFn(), 0)[0],
    ];
    promptInstance.options.header = headerParts.join('\n');

    promptInstance.options.footer = () => {
      const rp = buildRightPanel(panel.rightTitle, [], 0);
      return '\n' + PAD + boxBottomLine(lw) + ' ' + rp[rp.length - 1];
    };

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
      ], 'exit', {
        leftTitle: 'Main Menu',
        rightTitle: 'Preview',
        rightContentFn: (focused) => {
          if (focused && SUBMENU_PREVIEW[focused]) {
            const items = SUBMENU_PREVIEW[focused];
            if (items.length === 0) return [c.dim('Exit emuku')];
            return items.map(i => accent(i.charAt(0)) + i.slice(1));
          }
          return buildDeviceStatusLines();
        },
      });

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
    ], 'back', {
      activeTab: 'iOS',
      leftTitle: 'iOS Management',
      rightTitle: 'Device Status',
      rightContentFn: () => buildDeviceStatusLines(),
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'device-list': iosDeviceList,
      'device-start': () => iosDeviceStart(),
      'device-stop': () => iosDeviceStop(),
      'device-status': iosDeviceStatus,
    };

    const action = actions[choice];
    if (action) await runAction(action);
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
    ], 'back', {
      activeTab: 'Android',
      leftTitle: 'Android Management',
      rightTitle: 'Device Status',
      rightContentFn: () => buildDeviceStatusLines(),
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'device-list': androidDeviceList,
      'device-start': () => androidDeviceStart(),
      'device-stop': () => androidDeviceStop(),
      'device-status': androidDeviceStatus,
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function runtimeMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      { name: 'run-ios',     message: `${accent('▶')}  Run in iOS Simulator` },
      { name: 'run-android', message: `${accent('▶')}  Run in Android Emulator` },
      item('status',      '◉', 'Status'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Runtime',
      leftTitle: 'Runtime Management',
      rightTitle: 'Device Status',
      rightContentFn: () => buildDeviceStatusLines(),
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'run-ios': () => appRunIos(),
      'run-android': () => appRunAndroid(),
      'status': status,
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function setupMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('setup-ios',     '↧', 'Setup iOS'),
      item('setup-android', '↧', 'Setup Android'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Setup',
      leftTitle: 'Setup',
      rightTitle: 'Device Status',
      rightContentFn: () => buildDeviceStatusLines(),
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'setup-ios': createIos,
      'setup-android': createAndroid,
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function utilityMenu(): Promise<Nav> {
  while (true) {
    const choice = await selectMenu([
      item('bash-completion', '↳', 'Bash Completion'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Utility',
      leftTitle: 'Utility',
      rightTitle: 'Device Status',
      rightContentFn: () => buildDeviceStatusLines(),
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    const actions: Record<string, () => Promise<void>> = {
      'bash-completion': bashCompletion,
    };

    const action = actions[choice];
    if (action) await runAction(action);
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
