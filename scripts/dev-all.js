import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const commands = [
  { name: 'Next.js', command: 'npm', args: ['run', 'dev'], color: '\x1b[32m' },
  { name: 'Live WS', command: 'node', args: ['server/live-ws.js'], color: '\x1b[34m' },
  { name: 'Signal', command: 'node', args: ['server/signaling-server.js'], color: '\x1b[35m' }
];

commands.forEach(cmd => {
  const proc = spawn(cmd.command, cmd.args, {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${cmd.color}[${cmd.name}]\x1b[0m ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${cmd.color}[${cmd.name} ERROR]\x1b[0m ${data}`);
  });

  proc.on('close', (code) => {
    console.log(`${cmd.color}[${cmd.name}]\x1b[0m exited with code ${code}`);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down all services...');
  process.exit();
});
