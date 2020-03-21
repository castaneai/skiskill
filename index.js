const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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
  page.on("request", req => {
    if (req.resourceType() === "xhr") {
      console.log(`${req.method()} ${req.url()}`);
    }
  });
  await page.goto(url);
  await page.waitFor(3000);
  await page.screenshot({ path: "example.png" });
  await browser.close();
})();
