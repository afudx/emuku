import c from 'ansi-colors';

export async function help(): Promise<void> {
  console.log();
  console.log(c.bold.cyan('emuku') + c.dim(' — iOS & Android Emulator Control'));
  console.log();

  console.log(c.bold('USAGE'));
  console.log(`  emuku ${c.dim('<platform>')} ${c.dim('<command>')} ${c.dim('[options]')}`);
  console.log();

  console.log(c.bold('GENERAL'));
  row('emuku', 'Show this help');
  row('emuku --help, -h', 'Show this help');
  console.log();

  console.log(c.bold('iOS'));
  row('emuku ios', 'Show iOS commands');
  row('emuku ios device list', 'List all simulators (booted + shutdown)');
  row('emuku ios device start <id>', 'Start a simulator by UDID or name');
  console.log();

  console.log(c.bold('ANDROID'));
  row('emuku android', 'Show Android commands');
  row('emuku android device list', 'List all emulators (running + stopped)');
  row('emuku android device start <id>', 'Start an emulator by AVD name');
  console.log();

  console.log(c.bold('SETUP'));
  row('emuku create ios', 'Check & install iOS simulator prerequisites');
  row('emuku create android', 'Check & install Android emulator prerequisites');
  console.log();

  console.log(c.bold('TOOLS'));
  row('emuku tools bash-completion', 'Install shell completions (bash/zsh)');
  console.log();
}

function row(cmd: string, desc: string): void {
  const padded = ('  ' + c.cyan(cmd)).padEnd(50);
  console.log(padded + c.dim(desc));
}
