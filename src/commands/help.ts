export async function help(): Promise<void> {
  console.log('emuku - iOS & Android Emulator Control\n');
  console.log('USAGE');
  console.log('  emuku <platform> <command> [options]\n');
  console.log('COMMANDS');
  console.log('  emuku                         Show this help');
  console.log('  emuku --help, -h              Show this help\n');
  console.log('  emuku ios                     Show iOS commands');
  console.log('  emuku ios device list         List all iOS simulators');
  console.log('  emuku ios device start <id>   Start an iOS simulator\n');
  console.log('  emuku android                 Show Android commands');
  console.log('  emuku android device list     List all Android emulators');
  console.log('  emuku android device start <id>  Start an Android emulator\n');
  console.log('  emuku create ios              Set up iOS simulator prerequisites');
  console.log('  emuku create android          Set up Android emulator prerequisites\n');
  console.log('  emuku tools bash-completion   Install shell completions (bash/zsh)');
}
