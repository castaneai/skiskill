import { test } from '@playwright/test';
import { capture } from '../src/lib'

test('can capture', async ({ browser }) => {
  const session = process.env.SESSION
  if (!session) throw new Error('missing env: SESSION')

  const context = await browser.newContext()
  try {
    const partId = '22863003'
    await capture(context, 'out/ss.png', { session, partId, second: 284 })
  } finally {
    await context.close()
  }
});
