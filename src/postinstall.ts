import { execSync } from 'child_process';

const isCI = process.env.CI === 'true' || process.env.CI === '1';

// Skip in CI — browsers are typically pre-installed or not needed
if (isCI) process.exit(0);

try {
  console.log('[browser-agent] Installing Playwright Chromium browser...');
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('[browser-agent] Chromium ready.');
} catch {
  console.log(
    '\n[browser-agent] Could not auto-install Chromium. Run this manually:\n' +
    '  npx playwright install chromium\n'
  );
}
