import puppeteer from "puppeteer";

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
    await page.waitForFunction(canPlayVideo);
    await page.evaluate(() => window.vc.videoEl.play());
    await page.waitFor(step * 1000);
};

(async () => {
    const session = process.env.SESSION;
    if (!session) {
        console.error("env: SESSION not set");
        return;
    }

    const partId = process.env.PART;
    if (!partId) {
        console.error("env: PART not set");
        return;
    }
    console.log(`partId: ${partId}`);

    const captureSec = parseInt(process.argv[2]);
    if (isNaN(captureSec)) {
        console.error("Usage: kksk [captureSec]");
        return;
    }
    console.log(`capture sec: ${captureSec}`);

    const executablePath =
        process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "google-chrome-unstable";
    console.log(`executable: ${executablePath}`);
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath
    });
    const page = await browser.newPage();
    await page.setCookie({
        name: "certificate_session_id",
        value: session,
        domain: "anime.dmkt-sp.jp"
    });
    const url = `https://anime.dmkt-sp.jp/animestore/sc_d_pc?partId=${partId}`;
    await page.goto(url);
    await page.waitFor(1000);

    const videoSize = await page.evaluate(initializePlayer);
    await page.setViewport(videoSize);

    // do capture
    await seekVideo(page, captureSec);
    await page.screenshot({ path: `out/${partId}_${captureSec}.png` });
    await page.evaluate(() => window.vc.videoEl.pause());

    await browser.close();
})();
