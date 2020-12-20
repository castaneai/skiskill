import express from "express";
import puppeteer, { Browser } from "puppeteer";
import { sync as commandExistsSync } from 'command-exists';
import fs from 'fs';

type Second = number;

const keyInterval: Second = 6;

const initializePlayer = () => {
    const hideControls = () => {
        const el = document.querySelector(".controller") as HTMLElement | null;
        if (el !== null) el.style.display = "none";
    };
    window.vc.videoEl.pause();
    hideControls();
    return {
        width: window.vc.videoEl.videoWidth,
        height: window.vc.videoEl.videoHeight
    };
};

const canPlayVideo = () => {
    const el = document.querySelector(".loadingArea");
    return el !== null ? getComputedStyle(el).opacity === "0" : false;
};

const seekVideo = async (page: puppeteer.Page, to: Second) => {
    const prevKey: Second = Math.floor(to / keyInterval) * keyInterval;
    const step: Second = to - prevKey;
    console.log(`key: ${prevKey}, +${step}s`);
    await page.evaluate(s => window.vc.jump(s), prevKey);
    await page.waitFor(500); // wait for UI transition to show loading area
    await page.waitForFunction(canPlayVideo, { timeout: 5000 });
    await page.evaluate(() => window.vc.videoEl.play());
    await page.waitFor(step * 1000);
};

interface CaptureParams {
    session: string;
    partId: string;
    second: Second;
}

const capture = async (browser: puppeteer.Browser, outPath: string, params: CaptureParams) => {
    const page = await browser.newPage();
    try {
        await page.setCookie({
            name: "certificate_session_id",
            value: params.session,
            domain: "anime.dmkt-sp.jp"
        });
        const url = `https://anime.dmkt-sp.jp/animestore/sc_d_pc?partId=${params.partId}`;
        await page.goto(url);
        await page.waitFor(1000);

        const videoSize = await page.evaluate(initializePlayer);
        await page.setViewport(videoSize);

        await seekVideo(page, params.second);
        await page.screenshot({ path: outPath });
        await page.evaluate(() => window.vc.videoEl.pause());
        return true;
    } catch (err) {
        console.error(`error occured while processing in browser: ${err}`);
        await page.screenshot({ path: outPath });
        return false;
    } finally {
        await page.close();
    }
}

const session = process.env.SESSION;
if (!session) {
    throw 'env: SESSION not defined';
}

let browser: Browser;

const app = express();

app.get('/', async (req: express.Request, res: express.Response) => {
    const partId = req.query.partId?.toString();
    if (!partId) {
        console.error('query param: partId not found');
        res.sendStatus(400);
        return;
    }
    const second = parseInt(req.query.second?.toString() || "");
    if (isNaN(second)) {
        console.error('query param: second not found');
        res.sendStatus(400);
        return;
    }
    const outPath = '/tmp/out.png';
    console.log(`start capture partId: ${partId}, second: ${second}`);

    if (!browser) {
        browser = await launchBrowser();
    }

    const succeeded = await capture(browser, outPath, { session: session, partId: partId, second: second });
    if (!succeeded) {
        res.status(500);
    }
    res.sendFile(outPath);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('listening on port', port);
});

const launchBrowser = async () => {
    const executablePath = getBrowserExecutable();
    const args = ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent="Mozilla/5.0 (X11; CrOS armv7l 12371.89.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36"'];
    return puppeteer.launch({
        headless: false,
        args,
        executablePath,
    });
}

const getBrowserExecutable = () => {
    // macOS
    if (process.platform == 'darwin') {
        const path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (!fs.existsSync(path)) {
            throw `chrome not found in ${path}`;
        }
        return path;
    }

    // linux
    const ret = ['google-chrome-unstable', 'google-chrome-stable', 'chromium-browser'].find(path => {
        console.log(`${path} e`)
        return commandExistsSync(path);
    });
    if (ret) {
        return ret;
    }
    throw `chrome not found`;
}