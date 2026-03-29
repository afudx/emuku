import c from 'ansi-colors';

export async function help(): Promise<void> {
  console.log();
  console.log(c.bold.cyan('emuku') + c.dim(' — iOS & Android Emulator Control'));
  console.log();

  console.log(c.bold('USAGE'));
  console.log(`  emuku ${c.dim('<platform>')} ${c.dim('<command>')} ${c.dim('[options]')}`);
  console.log();

  console.log(c.bold('GENERAL'));
  row('emuku', 'Start interactive mode');
  row('emuku --help, -h', 'Show this help');
  console.log();

  console.log(c.bold('iOS'));
  row('emuku ios', 'Show iOS commands');
  row('emuku ios device list', 'List all simulators (booted + shutdown)');
  row('emuku ios device start <id>', 'Start a simulator by UDID or name');
  row('emuku ios device status', 'Show all running iOS devices');
  row('emuku ios device stop <id>', 'Stop a running simulator');
  console.log();

  console.log(c.bold('ANDROID'));
  row('emuku android', 'Show Android commands');
  row('emuku android device list', 'List all emulators (running + stopped)');
  row('emuku android device start <id>', 'Start an emulator by AVD name');
  row('emuku android device status', 'Show all running Android devices');
  row('emuku android device stop <id>', 'Stop a running emulator');
  console.log();

  console.log(c.bold('SETUP'));
  row('emuku create ios', 'Setup iOS simulator prerequisites');
  row('emuku create android', 'Setup Android emulator prerequisites');
  console.log();

  console.log(c.bold('RUNTIME'));
  row('emuku app run ios [id]', 'Run Flutter app on an iOS simulator');
  row('emuku app run android [id]', 'Run Flutter app on an Android emulator');
  row('emuku status', 'Show all running devices');
  console.log();

  console.log(c.bold('UTILITY'));
  row('emuku tools bash-completion', 'Install shell completions (bash/zsh)');
  console.log();
}

function row(cmd: string, desc: string): void {
  const padded = ('  ' + c.cyan(cmd)).padEnd(50);
  console.log(padded + c.dim(desc));
}
