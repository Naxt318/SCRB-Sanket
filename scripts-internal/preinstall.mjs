// Cross-platform replacement for the original `sh -c '...'` preinstall
// script, which failed on Windows (no /bin/sh available outside
// Git Bash/WSL). Same behavior: remove stray lockfiles from other
// package managers, and require pnpm.
import { unlinkSync } from 'node:fs';

for (const file of ['package-lock.json', 'yarn.lock']) {
  try {
    unlinkSync(file);
  } catch {
    // fine if it doesn't exist
  }
}

const userAgent = process.env.npm_config_user_agent ?? '';
if (!userAgent.startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}
