import puppeteer, { Locator } from "puppeteer";
import { CacheOrComputer, WriteUtil } from "./util/api-cache";
import { setTimeout } from "timers";
import  p from "node:process";

type P = {
  RUNWAY_USERNAME: string;
  RUNWAY_PASSWORD: string;
  RUNWAY_COOKIE?: string;
  RUNWAY_TOKEN?: string;
  prompt: string;
  imageFilePath: string;
};
async function process(props: P, util: WriteUtil) {
  const browser = await puppeteer.launch({ headless: false, protocolTimeout: 30 * 60 * 1000 });
  const page = await browser.newPage();
  const timeout = 50000;
  page.setDefaultTimeout(timeout);
  if(props.RUNWAY_TOKEN) {
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem("RW_USER_TOKEN", token);
    }, props.RUNWAY_TOKEN);
  }
  if(props.RUNWAY_COOKIE) {
    const cookies = JSON.parse(props.RUNWAY_COOKIE);
    await page.setCookie(...cookies);
  }

  {
    const targetPage = page;
    await targetPage.setViewport({
      width: 1499,
      height: 1383,
    });
  }
  {
    const targetPage = page;
    const promises: Promise<unknown>[] = [];
    const startWaitingForEvents = () => {
      promises.push(targetPage.waitForNavigation());
    };
    startWaitingForEvents();
    await targetPage.goto("https://app.runwayml.com/login");
    await Promise.all(promises);
  }
  if (page.url() === "https://app.runwayml.com/login") {
    {
      const targetPage = page;
      await Locator.race([
        targetPage.locator("::-p-aria(Username or Email)"),
        targetPage.locator("input[type='text']"),
        targetPage.locator(
          '::-p-xpath(//*[@id=\\"root\\"]/div/div[4]/div[1]/div/div[2]/div/div[2]/div/form/div[1]/input[1])'
        ),
        targetPage.locator(":scope >>> input[type='text']"),
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 98.25,
            y: 9.609375,
          },
        });
    }
    {
      const targetPage = page;
      await Locator.race([
        targetPage.locator("::-p-aria(Username or Email)"),
        targetPage.locator("input[type='text']"),
        targetPage.locator(
          '::-p-xpath(//*[@id=\\"root\\"]/div/div[4]/div[1]/div/div[2]/div/div[2]/div/form/div[1]/input[1])'
        ),
        targetPage.locator(":scope >>> input[type='text']"),
      ])
        .setTimeout(timeout)
        .fill(props.RUNWAY_USERNAME);
    }
    {
      const targetPage = page;
      await Locator.race([
        targetPage.locator("::-p-aria(Password)"),
        targetPage.locator("input[type='password']"),
        targetPage.locator(
          '::-p-xpath(//*[@id=\\"root\\"]/div/div[4]/div[1]/div/div[2]/div/div[2]/div/form/div[1]/input[2])'
        ),
        targetPage.locator(":scope >>> input[type='password']"),
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 159.25,
            y: 20.609375,
          },
        });
    }
    {
      const targetPage = page;
      await Locator.race([
        targetPage.locator("::-p-aria(Password)"),
        targetPage.locator("input[type='password']"),
        targetPage.locator(
          '::-p-xpath(//*[@id=\\"root\\"]/div/div[4]/div[1]/div/div[2]/div/div[2]/div/form/div[1]/input[2])'
        ),
        targetPage.locator(":scope >>> input[type='password']"),
      ])
        .setTimeout(timeout)
        .fill(props.RUNWAY_PASSWORD);
    }
    await sleep(2000);
    {
      const targetPage = page;
      await Locator.race([
        targetPage.locator("::-p-aria(Log in)"),
        targetPage.locator("form > button"),
        targetPage.locator(
          '::-p-xpath(//*[@id=\\"root\\"]/div/div[4]/div[1]/div/div[2]/div/div[2]/div/form/button)'
        ),
        targetPage.locator(":scope >>> form > button"),
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 179.25,
            y: 34.609375,
          },
        });
    }
    await page.waitForNavigation();
    console.log("puppeteer cookies", await page.cookies());
    console.log("puppeteer token", await page.evaluate(() => localStorage.getItem("RW_USER_TOKEN")))
  }
  {
    const targetPage = page;
    const promises: Promise<unknown>[] = [];
    const startWaitingForEvents = () => {
      promises.push(targetPage.waitForNavigation());
    };
    startWaitingForEvents();
    await targetPage.goto(
      "https://app.runwayml.com/video-tools/teams/mobzael/ai-tools/generative-video"
    );
    await Promise.all(promises);
  }
  /*{
        const targetPage = page;
        await Locator.race([
            targetPage.locator('::-p-aria(Drop an image or click to upload Select from Assets) >>>> ::-p-aria([role=\\"paragraph\\"])'),
            targetPage.locator('#data-panel-id-left-panel-panel-top p'),
            targetPage.locator('::-p-xpath(//*[@id=\\"data-panel-id-left-panel-panel-top\\"]/div/div[2]/div/div/p)'),
            targetPage.locator(':scope >>> #data-panel-id-left-panel-panel-top p'),
            targetPage.locator('::-p-text(Drop an image)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 163.21875,
                y: 4.078125,
              },
            });
    }*/
  await sleep(2000);
  const fileInput = await page.waitForSelector("input[type=file]", { timeout });
  if (!fileInput) throw Error("no file input");
  const file = p.cwd() + "/" + props.imageFilePath;
  console.log("uploading", file);
  await fileInput.uploadFile(file);
  await sleep(10000);
  {
    const targetPage = page;
    await Locator.race([
      targetPage.locator("::-p-aria(Text Prompt Input)"),
      targetPage.locator("div.TextInput-module__textbox__X8YXn"),
      targetPage.locator(
        '::-p-xpath(//*[@id=\\"data-panel-id-left-panel-panel-bottom\\"]/div/div/div/div/div[1])'
      ),
      targetPage.locator(":scope >>> div.TextInput-module__textbox__X8YXn"),
    ])
      .setTimeout(timeout)
      .fill(props.prompt);
    /*.click({
              offset: {
                x: 123,
                y: 41,
              },
            });*/
  }
  {
    const targetPage = page;
    await Locator.race([
      targetPage.locator("button:not([disabled])::-p-text(Generate)"),
      targetPage.locator(
        "div.GenVideoNextUIV1PanelGroup__panelContainer__hmb9i > div.Base__Box-sc-thne2y-0 > div span > span"
      ),
      targetPage.locator(
        '::-p-xpath(//*[@id=\\"data-panel-id-1\\"]/div[1]/div/div/div/div[2]/div[2]/div/div/button/span/span)'
      ),
      targetPage.locator(
        ":scope >>> div.GenVideoNextUIV1PanelGroup__panelContainer__hmb9i > div.Base__Box-sc-thne2y-0 > div span > span"
      ),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 44.1875,
          y: 11,
        },
      });
  }
  console.log("waiting for video");
  const vid = await page.waitForSelector("video source", {
    timeout: 30 * 60 * 1000,
  });
  if (!vid) throw Error("video not found");
  const src = await vid.evaluate((el: HTMLSourceElement) => el.src);
  const ab = await fetch(src).then((res) => res.arrayBuffer());
  await util.writeCompanion("-vid.mp4", new Uint8Array(ab));

  await browser.close();
}

export async function step05ImageToVideo(
  apiFromCacheOr: CacheOrComputer,
  config: {
    RUNWAY_USERNAME?: string;
    RUNWAY_PASSWORD?: string;
  },
  prompt: string,
  imageFilePath: string
) {
  if (!config.RUNWAY_PASSWORD || !config.RUNWAY_USERNAME)
    throw Error("no RUNWAY_PASSWORD or RUNWAY_USERNAME");
  const input = {
    prompt,
    imageFilePath,
  };
  const full = {
    RUNWAY_USERNAME: config.RUNWAY_USERNAME,
    RUNWAY_PASSWORD: config.RUNWAY_PASSWORD,
    ...input,
  };
  const result = await apiFromCacheOr(
    `https://app.runwayml.com/...`,
    input,
    async (util) => {
      const result = await process(full, util);
      return {};
    }
  );
  return result;
}
async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
