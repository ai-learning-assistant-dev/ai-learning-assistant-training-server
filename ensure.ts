import { readFileSync, watchFile, writeFileSync } from 'node:fs';

try {
  writeFileSync('command.md', '');
} catch (_error) {
  //
}

watchFile('command.md', (_curr, _prev) => {
  const content = readFileSync('command.md', 'utf-8');
  if (content.trim().endsWith('done')) {
    const data = content.substring(0, content.length - 4);
    console.log(data);
    writeFileSync('command.md', '');
    process.exit(0);
  }
});
