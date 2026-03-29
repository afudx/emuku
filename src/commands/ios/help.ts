export async function iosHelp(): Promise<void> {
  console.log('emuku ios - iOS Simulator Commands\n');
  console.log('COMMANDS');
  console.log('  emuku ios device list         List all iOS simulators (booted + shutdown)');
  console.log('  emuku ios device start <id>   Start a simulator by UDID or name\n');
  console.log('SETUP');
  console.log('  emuku create ios              Check and install iOS simulator prerequisites');
}
