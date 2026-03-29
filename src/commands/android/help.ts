import c from 'ansi-colors';

export async function androidHelp(): Promise<void> {
  console.log();
  console.log(c.bold('emuku android') + c.dim(' — Android Emulator Commands'));
  console.log();

  console.log(c.bold('COMMANDS'));
  row('emuku android device list', 'List all emulators (running + stopped)');
  row('emuku android device start <id>', 'Start an emulator by AVD name');
  console.log();

  console.log(c.bold('SETUP'));
  row('emuku create android', 'Check & install Android emulator prerequisites');
  console.log();

  console.log(c.dim('  <id> is the AVD name (partial match supported)'));
  console.log();
}

function row(cmd: string, desc: string): void {
  const padded = ('  ' + c.cyan(cmd)).padEnd(50);
  console.log(padded + c.dim(desc));
}
