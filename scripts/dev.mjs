import { spawn } from 'node:child_process';
import net from 'node:net';

const npmRunCommand =
  process.env.npm_execpath && process.env.npm_execpath.endsWith('.js')
    ? { command: process.execPath, prefixArgs: [process.env.npm_execpath] }
    : {
        command: process.platform === 'win32' ? 'cmd.exe' : 'npm',
        prefixArgs: process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd'] : [],
      };
const defaultApiPort = Number(process.env.API_PORT ?? '3001');
const defaultClientPort = Number(process.env.VITE_PORT ?? '3000');
const apiPort = await findAvailablePort(defaultApiPort);
const clientPort = await findAvailablePort(defaultClientPort);

if (apiPort !== defaultApiPort) {
  console.log(`[dev] API port ${defaultApiPort} is busy, using ${apiPort} instead.`);
}

if (clientPort !== defaultClientPort) {
  console.log(`[dev] Web port ${defaultClientPort} is busy, using ${clientPort} instead.`);
}

const sharedEnv = {
  ...process.env,
  API_PORT: String(apiPort),
  VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
};

const children = [
  runScript('dev:server', '[api]', { env: sharedEnv }),
  runScript('dev:client', '[web]', {
    args: ['--', `--port=${clientPort}`],
    env: sharedEnv,
  }),
];

let shuttingDown = false;

function runScript(scriptName, label, options = {}) {
  const child = spawn(npmRunCommand.command, [...npmRunCommand.prefixArgs, 'run', scriptName, ...(options.args ?? [])], {
    stdio: 'inherit',
    env: options.env ?? process.env,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.log(`${label} exited with signal ${signal}`);
    } else if (code !== 0) {
      console.log(`${label} exited with code ${code}`);
    }

    shutdown(code ?? 1);
  });

  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }
    process.exit(exitCode);
  }, 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function findAvailablePort(startPort) {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}
