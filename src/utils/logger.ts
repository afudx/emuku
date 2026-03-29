import c from 'ansi-colors';

export const logger = {
  info: (msg: string) => console.log(c.cyan('ℹ') + ' ' + msg),
  success: (msg: string) => console.log(c.green('✓') + ' ' + msg),
  warn: (msg: string) => console.log(c.yellow('⚠') + ' ' + msg),
  error: (msg: string) => console.error(c.red('✗') + ' ' + msg),
  heading: (msg: string) => console.log(c.bold.underline(msg)),
};
