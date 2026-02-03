import { createServer } from 'node:net';
let startPort = 5432;
export async function getAvailablePort(): Promise<number> {
  const maxPort = 65535;
  const port = startPort;
  startPort += 1;

  if (port > maxPort) {
    throw new Error('No available ports found');
  }
  try {
    const server = createServer();
    server.listen(port);

    await new Promise<void>((resolve, reject) => {
      server.on('listening', () => {
        server.close();
        resolve();
      });
      server.on('error', reject);
    });
    return port;
  } catch (error) {
    return getAvailablePort();
  }
}
