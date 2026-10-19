/// <reference types="vitest/config" />
/**
 * Vitest config: Astro's Vite config (getViteConfig) so .astro components can be compiled
 * and rendered with the container API (tests/layout.render.test.ts). This loads
 * astro.config.mjs, so the same env resolution and SITE_URL rules apply to tests.
 *
 * Test isolation (F12): no repository .env* file is ever read while testing.
 *  - Vite's own env loading (import.meta.env) and Astro's env loader: envDir: false.
 *  - astro.config.mjs itself reads no env file when VITEST=true (set by Vitest).
 *  - Subprocess tests run against temp copies / fixture roots with a controlled env
 *    (tests/helpers/node-io.mjs).
 * Builds are unaffected: this file is used only by Vitest.
 */
import { getViteConfig } from 'astro/config';

export default getViteConfig(
  {
    envDir: false,
    test: {
      include: ['tests/**/*.test.ts'],
    },
  },
  { vite: { envDir: false } },
);
