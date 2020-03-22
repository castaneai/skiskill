const puppeteer = require("puppeteer");
const keyIntervalSec = 6;

const jumpVideo = async (page, sec) => {
  const keySec = Math.floor(sec / keyIntervalSec) * keyIntervalSec;
  const stepSec = sec - keySec + 1; // +1 why??
  console.log(`key: ${keySec}, +${stepSec} steps`);
  await page.evaluate(s => window.vc.jump(s), keySec);
  await page.waitFor(500); // wait for a short time between clicking and loading on DOM
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector(".loadingArea")).opacity === "0"
  );
  await page.evaluate(() => window.vc.videoEl.play());
  await page.waitFor(stepSec * 1000);
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

  // initialize video player for capturing
  await page.waitFor(1000);
  const videoSize = await page.evaluate(() => {
    window.vc.videoEl.pause();
    document.querySelector(".controller").style.display = "none";
    return {
      width: window.vc.videoEl.videoWidth,
      height: window.vc.videoEl.videoHeight
    };
  });
  await page.setViewport(videoSize);

  // do capture
  await jumpVideo(page, captureSec);
  await page.screenshot({ path: `out/${partId}_${captureSec}.png` });
  await page.evaluate(() => window.vc.videoEl.pause());

  await browser.close();
})();
