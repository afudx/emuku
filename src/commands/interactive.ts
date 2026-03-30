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
import { createIos, createIosStatus } from './create/ios.js';
import { createAndroid, createAndroidStatus } from './create/android.js';
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

const HOVER_DESCRIPTIONS: Record<string, string> = {
  // Main Menu
  'ios': 'Manage iOS devices lifecycle and status.',
  'android': 'Manage Android emulators lifecycle and status.',
  'runtime': 'Manage active runtimes and application deployments.',
  'setup': 'Configure prerequisites and prepare your environment.',
  'utility': 'Assorted tools and shell utilities.',
  'exit': 'Exit emuku CLI.',

  // Device Management
  'device-list': 'View a list of all installed simulators/emulators.',
  'device-start': 'Select and boot a specific simulator/emulator.',
  'device-stop': 'Select and shut down a running simulator/emulator.',
  'device-status': 'Display realtime statistics of running devices.',

  // Runtime
  'run-ios': 'Launch the React Native app onto a running iOS simulator.',
  'run-android': 'Launch the React Native app onto a running Android emulator.',
  'status': 'View global runtime status across all platforms.',

  // Setup
  'setup-ios': 'Check and install macOS requirements for iOS simulators.',
  'setup-android': 'Check and install requirements for Android emulators.',

  // Utility
  'bash-completion': 'Install bash/zsh shell auto-completion scripts.',

  // Common
  'back': 'Return to the previous menu.',
  'home': 'Return to the main dashboard.',
};

function strip(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '').trim().replace(/^.+?\s+/, '');
}

export function getHoverDescription(focused?: string): string[] {
  if (!focused) return [c.dim('Navigate using arrow keys. Press Enter to select.')];
  const desc = HOVER_DESCRIPTIONS[focused] || 'Navigate using arrow keys. Press Enter to select.';
  return [c.dim(desc)];
}

export interface PanelConfig {
  activeTab?: string;
  leftTitle: string;
  rightTitle: string | ((focusedName?: string, focusedMessage?: string) => string);
  rightContentFn: (focusedName?: string) => Promise<string[]> | string[];
}

export async function selectMenu(
  choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string }>,
  cancelAction: string = 'exit',
  panel: PanelConfig,
): Promise<{ choice: string; leftLines: string[] }> {
  process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
  let finalLeftLines: string[] = [];
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
      finalLeftLines = leftLines;

      const focusedChoice = this.choices?.[this.index];
      const focusedName = focusedChoice?.name || '';
      const focusedMessage = strip(focusedChoice?.message || '');

      const rightTitle = typeof panel.rightTitle === 'function' ? panel.rightTitle(focusedName, focusedMessage) : (panel.rightTitle || '');
      const rightContent = await panel.rightContentFn(focusedName);
      
      const totalHeight = Math.max(leftLines.length, rightContent.length);
      const rightPanel = buildRightPanel(rightTitle, rightContent, totalHeight);

      const combined = [];
      const renderCount = Math.max(leftLines.length, rightPanel.length - 2);
      for (let i = 0; i < renderCount; i++) {
        const leftLine = i < leftLines.length ? leftLines[i] : '';
        const paddedLeft = padEnd(leftLine, lw);
        const rightLine = i < rightPanel.length - 2 ? rightPanel[i + 1] : boxEmptyLine(rightWidth());
        combined.push(paddedLeft + ' ' + rightLine);
      }

      return combined.join('\n');
    };

    const initialRightTitle = typeof panel.rightTitle === 'function' ? panel.rightTitle() : (panel.rightTitle || '');
    const headerParts = [
      '',
      renderTitle(),
      '',
      renderTabs(panel.activeTab),
      '',
      PAD + boxTopLine(panel.leftTitle, lw) + ' ' + buildRightPanel(initialRightTitle, [], 0)[0],
    ];
    promptInstance.options.header = headerParts.join('\n');

    promptInstance.options.footer = () => {
      const title = typeof panel.rightTitle === 'function' ? panel.rightTitle() : (panel.rightTitle || '');
      const rp = buildRightPanel(title, [], 0);
      return '\n' + PAD + boxBottomLine(lw) + ' ' + rp[rp.length - 1];
    };

    const response = await promptInstance.run();
    return { choice: response, leftLines: finalLeftLines };
  } catch {
    return { choice: cancelAction, leftLines: [] };
  }
}

export interface RightPanelConfig {
  activeTab?: string;
  leftTitle: string;
  leftLines: string[];
  rightTitle: string | ((focusedName?: string, focusedMessage?: string) => string);
  rightContentFn?: (focusedName?: string) => Promise<string[]> | string[];
}

export async function selectRightMenu(
  choices: ReadonlyArray<{ name: string; message: string } | { role: string; message: string }>,
  cancelAction: string,
  panel: RightPanelConfig,
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

      const focusedChoice = this.choices?.[this.index];
      const focusedName = focusedChoice?.name || '';
      const focusedMessage = strip(focusedChoice?.message || '');

      const rightTitle = typeof panel.rightTitle === 'function' ? panel.rightTitle(focusedName, focusedMessage) : (panel.rightTitle || '');
      const rightContent = panel.rightContentFn ? await panel.rightContentFn(focusedName) : [];

      const rightLines = rendered.split('\n');
      const combinedRight = rightContent.length > 0 ? [...rightContent, '', ...rightLines] : rightLines;
      const rightPanel = buildRightPanel(rightTitle, combinedRight, combinedRight.length);

      const combined = [];
      const renderCount = Math.max(panel.leftLines.length, rightPanel.length - 2);
      for (let i = 0; i < renderCount; i++) {
        const leftLine = i < panel.leftLines.length ? panel.leftLines[i] : '';
        const paddedLeft = padEnd(leftLine, lw);
        const rightLine = i < rightPanel.length - 2 ? rightPanel[i + 1] : boxEmptyLine(rightWidth());
        combined.push(paddedLeft + ' ' + rightLine);
      }

      return combined.join('\n');
    };

    const initialRightTitle = typeof panel.rightTitle === 'function' ? panel.rightTitle() : (panel.rightTitle || '');
    const headerParts = [
      '',
      renderTitle(),
      '',
      renderTabs(panel.activeTab),
      '',
      PAD + boxTopLine(panel.leftTitle, lw) + ' ' + buildRightPanel(initialRightTitle, [], 0)[0],
    ];
    promptInstance.options.header = headerParts.join('\n');

    promptInstance.options.footer = () => {
      const rp = buildRightPanel(initialRightTitle, [], 0);
      return '\n' + PAD + boxBottomLine(lw) + ' ' + rp[rp.length - 1];
    };

    const response = await promptInstance.run();
    return response;
  } catch {
    return cancelAction;
  }
}

export async function showReadOnlyRightMenu(
  leftLines: string[],
  leftTitle: string,
  activeTab: PanelConfig['activeTab'],
  rightTitle: string,
  content: string[]
): Promise<void> {
  const blank = content.length === 0 ? [c.dim('No data available.')] : content;
  await selectRightMenu([
    { name: 'back', message: 'Back' }
  ], 'back', {
    activeTab,
    leftTitle,
    leftLines,
    rightTitle,
    rightContentFn: () => blank
  });
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
      const { choice } = await selectMenu([
        item('ios',     '○', 'iOS'),
        item('android', '△', 'Android'),
        item('runtime', '◇', 'Runtime'),
        item('setup',   '⚙', 'Setup'),
        item('utility', '⊞', 'Utility'),
        SEP(),
        { name: 'exit', message: `${accent('✕')}  Exit` },
      ], 'exit', {
        leftTitle: 'Main Menu',
        rightTitle: (_, message) => message || 'Preview',
        rightContentFn: getHoverDescription,
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
    const { choice, leftLines } = await selectMenu([
      item('device-list',   '≡', 'Device List'),
      item('device-start',  '▶', 'Device Start'),
      item('device-stop',   '■', 'Device Stop'),
      item('device-status', '◉', 'Device Status'),
      ...navItems(),
    ], 'back', {
      activeTab: 'iOS',
      leftTitle: 'iOS Management',
      rightTitle: (_, message) => message || 'Preview',
      rightContentFn: getHoverDescription,
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    if (choice === 'device-list') {
      const content = (await iosDeviceList()) || [];
      await showReadOnlyRightMenu(leftLines, 'iOS Management', 'iOS', 'Device List', content);
      continue;
    }
    if (choice === 'device-status') {
      const content = (await iosDeviceStatus()) || [];
      await showReadOnlyRightMenu(leftLines, 'iOS Management', 'iOS', 'Running Devices', content);
      continue;
    }

    const actions: Record<string, () => Promise<void>> = {
      'device-start': () => iosDeviceStart(undefined, async (choices, message) => {
        const res = await selectRightMenu(choices, 'cancel', { activeTab: 'iOS', leftTitle: 'iOS Management', leftLines, rightTitle: message });
        if (res === 'cancel') throw new Error('');
        return res;
      }),
      'device-stop': () => iosDeviceStop(undefined, async (choices, message) => {
        const res = await selectRightMenu(choices, 'cancel', { activeTab: 'iOS', leftTitle: 'iOS Management', leftLines, rightTitle: message });
        if (res === 'cancel') throw new Error('');
        return res;
      }),
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function androidMenu(): Promise<Nav> {
  while (true) {
    const { choice, leftLines } = await selectMenu([
      item('device-list',   '≡', 'Device List'),
      item('device-start',  '▶', 'Device Start'),
      item('device-stop',   '■', 'Device Stop'),
      item('device-status', '◉', 'Device Status'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Android',
      leftTitle: 'Android Management',
      rightTitle: (_, message) => message || 'Preview',
      rightContentFn: getHoverDescription,
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    if (choice === 'device-list') {
      const content = (await androidDeviceList()) || [];
      await showReadOnlyRightMenu(leftLines, 'Android Management', 'Android', 'Emulator List', content);
      continue;
    }
    if (choice === 'device-status') {
      const content = (await androidDeviceStatus()) || [];
      await showReadOnlyRightMenu(leftLines, 'Android Management', 'Android', 'Running Emulators', content);
      continue;
    }

    const actions: Record<string, () => Promise<void>> = {
      'device-start': () => androidDeviceStart(undefined, async (choices, message) => {
        const res = await selectRightMenu(choices, 'cancel', { activeTab: 'Android', leftTitle: 'Android Management', leftLines, rightTitle: message });
        if (res === 'cancel') throw new Error('');
        return res;
      }),
      'device-stop': () => androidDeviceStop(undefined, async (choices, message) => {
        const res = await selectRightMenu(choices, 'cancel', { activeTab: 'Android', leftTitle: 'Android Management', leftLines, rightTitle: message });
        if (res === 'cancel') throw new Error('');
        return res;
      }),
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function runtimeMenu(): Promise<Nav> {
  while (true) {
    const { choice, leftLines } = await selectMenu([
      { name: 'run-ios',     message: `${accent('▶')}  Run in iOS Simulator` },
      { name: 'run-android', message: `${accent('▶')}  Run in Android Emulator` },
      item('status',      '◉', 'Status'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Runtime',
      leftTitle: 'Runtime Management',
      rightTitle: (_, message) => message || 'Preview',
      rightContentFn: getHoverDescription,
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    if (choice === 'status') {
      const content = (await status()) || [];
      await showReadOnlyRightMenu(leftLines, 'Runtime Management', 'Runtime', 'Runtime Status', content);
      continue;
    }

    const actions: Record<string, () => Promise<void>> = {
      'run-ios': () => appRunIos(),
      'run-android': () => appRunAndroid(),
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function setupMenu(): Promise<Nav> {
  while (true) {
    const { choice, leftLines } = await selectMenu([
      item('setup-ios',     '↧', 'Setup iOS'),
      item('setup-android', '↧', 'Setup Android'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Setup',
      leftTitle: 'Setup',
      rightTitle: (_, message) => message || 'Preview',
      rightContentFn: getHoverDescription,
    });

    if (choice === 'back' || choice === 'home') return choice;
    if (choice === 'exit') return 'exit';

    if (choice === 'setup-ios') {
      const content = await createIosStatus();
      await showReadOnlyRightMenu(leftLines, 'Setup', 'Setup', 'iOS Prerequisites', content);
      await runAction(() => createIos(leftLines));
      continue;
    }
    if (choice === 'setup-android') {
      const content = await createAndroidStatus();
      await showReadOnlyRightMenu(leftLines, 'Setup', 'Setup', 'Android Prerequisites', content);
      await runAction(() => createAndroid(leftLines));
      continue;
    }

    const actions: Record<string, () => Promise<void>> = {
    };

    const action = actions[choice];
    if (action) await runAction(action);
  }
}

async function utilityMenu(): Promise<Nav> {
  while (true) {
    const { choice } = await selectMenu([
      item('bash-completion', '↳', 'Bash Completion'),
      ...navItems(),
    ], 'back', {
      activeTab: 'Utility',
      leftTitle: 'Utility',
      rightTitle: (_, message) => message || 'Preview',
      rightContentFn: getHoverDescription,
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
