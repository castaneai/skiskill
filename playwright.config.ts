import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv'
dotenv.config()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    // Must be set to false if using Google Chrome
    headless: false,
  },

  projects: [
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     launchOptions: {
    //       firefoxUserPrefs: {
    //         // Enable DRM components
    //         'media.eme.enabled': true,
    //         'media.gmp-manager.updateEnabled': true,
    //         // Enable HTTPS-only mode for play video
    //         // https://greasyfork.org/en/scripts/471042-d%E3%82%A2%E3%83%8B%E3%83%A1%E3%82%B9%E3%83%88%E3%82%A2plus
    //         'dom.security.https_only_mode': true,
    //       }
    //     }
    //    },
    // },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome', 
        launchOptions: {
          // Enable DRM components
          ignoreDefaultArgs: ['--disable-component-update'],
        },
      },
    },
  ],
});
