import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    launchOptions: {
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--use-angle=swiftshader"],
    },
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command:
      "PALETTO_DISABLE_BUILD_CACHE=true PALETTO_DEMO=true PALETTO_DATA_FILE=/tmp/paletto-test-browser.json APP_ORIGIN=http://127.0.0.1:3100 npm run test:serve",
    url: "http://127.0.0.1:3100/explore",
    reuseExistingServer: false,
    timeout: 120000,
  },
})
