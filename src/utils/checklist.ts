import c from 'ansi-colors';
import type { PrerequisiteCheck } from '../types/prerequisite.js';

export function renderChecklist(items: PrerequisiteCheck[]): void {
  for (const item of items) {
    const mark = item.installed ? c.green('✓') : c.red('✗');
    const name = item.installed ? c.green(item.name) : c.red(item.name);
    const detail = item.installed
      ? item.version ? c.dim(` (${item.version})`) : ''
      : item.fixInstructions ? c.dim(` — ${item.fixInstructions}`) : '';
    console.log(`  ${mark} ${name}${detail}`);
  }
}
