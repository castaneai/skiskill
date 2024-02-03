import { BrowserContext, Page } from 'playwright'

type Second = number;

const keyInterval: Second = 6;


const initializePlayer = async (page: Page) => {
    const size = await page.evaluate(async () => {
        const hideControls = () => {
            const el = document.querySelector(".controller") as HTMLElement
            if (el) el.style.opacity = "0"
        }
        const ve = window.vc.videoEl
        hideControls()
        return {
            width: ve.videoWidth,
            height: ve.videoHeight
        }
    })
    await page.setViewportSize(size)
}

const canPlayVideo = () => {
    const el = document.querySelector(".loadingArea");
    return el !== null ? getComputedStyle(el).opacity === "0" : false;
};

const seekVideo = async (page: Page, to: Second) => {
    const prevKey: Second = Math.floor(to / keyInterval) * keyInterval;
    const step: Second = to - prevKey;
    console.log(`key: ${prevKey}, +${step}s`);
    await page.evaluate(s => window.vc.jump(s), prevKey);
    await page.locator('#video').evaluate(el => new Promise<void>((resolve) => {
        el.addEventListener('seeked', () => resolve())
    }), undefined, {timeout: 5000})
    await page.waitForTimeout(500); // wait for UI transition to show loading area
    await page.waitForFunction(canPlayVideo, { timeout: 5000 });
    await page.evaluate(() => window.vc.videoEl.play());
    await page.waitForFunction(() => !window.vc.videoEl.paused)
    await page.waitForTimeout(step * 1000);
};

interface CaptureParams {
    session: string;
    partId: string;
    second: Second;
}

export async function capture(context: BrowserContext, outPath: string, params: CaptureParams): Promise<boolean> {
    if (!params.session) throw new Error('session is missing')
    await context.addCookies([{
        name: "certificate_session_id",
        value: params.session,
        domain: ".animestore.docomo.ne.jp",
        path: "/",
    }])
    const page = await context.newPage()
    try {
        const url = `https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=${params.partId}`
        await page.goto(url)
        await page.waitForFunction(() => window.vc.videoEl.readyState >= 4, undefined, {timeout: 10000})
        await initializePlayer(page)
        await seekVideo(page, params.second)
        await page.locator('#video').screenshot({ path: outPath })
        return true
    } catch (err) {
        await page.screenshot({ path: outPath, timeout: 5000 });
        return false
    } finally {
        await page.close()
    }
}
