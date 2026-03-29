export async function androidHelp(): Promise<void> {
  console.log('emuku android - Android Emulator Commands\n');
  console.log('COMMANDS');
  console.log('  emuku android device list         List all Android emulators (running + stopped)');
  console.log('  emuku android device start <id>   Start an emulator by AVD name\n');
  console.log('SETUP');
  console.log('  emuku create android              Check and install Android emulator prerequisites');
}
