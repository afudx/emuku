import c from 'ansi-colors';

export async function iosHelp(): Promise<void> {
  console.log();
  console.log(c.bold('emuku ios') + c.dim(' — iOS Simulator Commands'));
  console.log();

  console.log(c.bold('COMMANDS'));
  row('emuku ios device list', 'List all simulators (booted + shutdown)');
  row('emuku ios device start <id>', 'Start a simulator by UDID or name');
  console.log();

  console.log(c.bold('SETUP'));
  row('emuku create ios', 'Check & install iOS simulator prerequisites');
  console.log();

  console.log(c.dim('  <id> can be a full UDID or a device name (case-insensitive, partial match)'));
  console.log();
}

function row(cmd: string, desc: string): void {
  const padded = ('  ' + c.cyan(cmd)).padEnd(50);
  console.log(padded + c.dim(desc));
}
