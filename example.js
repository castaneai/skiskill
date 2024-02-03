import { chromium, devices } from 'playwright'
import * as kksk from "./dist/lib.js"

const browser = await chromium.launch({
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    headless: false,
    launchOptions: {
        // Enable DRM components
        ignoreDefaultArgs: ['--disable-component-update'],
    },
})
const context = await browser.newContext()
if (!await kksk.capture(context, 'example.png', {session: process.env.SESSION, partId: 22863003, second: 284})) {
    console.error('error occured in capturing')
}
console.log(`captured to ./example.png`)