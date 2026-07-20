import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

/**
 * Browser harness config (SDK-00 scaffold).
 * Run via `AXATALK_SDK_BROWSER=1 npm run test:browser` after
 * `npx playwright install chromium`.
 */
export default defineConfig({
  test: {
    include: ['tests/browser/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }]
    }
  }
});
