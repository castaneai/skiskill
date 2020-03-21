const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    executablePath: "google-chrome-unstable"
  });
  const page = await browser.newPage();
  const session = process.env.SESSION;
  if (!session) {
    console.error("env: SESSION not set");
    return;
  }
  await page.setCookie({
    name: "certificate_session_id",
    value: session,
    domain: "anime.dmkt-sp.jp"
  });
  const partId = process.env.PART;
  if (!partId) {
    console.error("env: PART not set");
    return;
  }
  const url = `https://anime.dmkt-sp.jp/animestore/sc_d_pc?partId=${partId}`;
  await page.goto(url);
  await page.waitFor(1000); // wait for video start
  await page.evaluate(() => {
    var vc = window.vc;
    vc.videoEl.pause();
  });

  // simple example: jump frames per 100sec and capture image
  for (let i = 0; i < 10; i++) {
    var sec = i * 100;
    console.log(`jump: ${sec}`);
    await page.evaluate(sec => window.vc.jump(sec), sec);
    await page.waitFor(1000);
    await page.screenshot({ path: `out/${partId}_${sec}.png` });
  }
  await browser.close();
})();
