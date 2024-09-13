import p from "node:process";
import puppeteer, { Locator, Page } from "puppeteer";
import { sleep } from "./util";
import { CacheOrComputer, WriteUtil } from "./util/api-cache";

type P = {
  RUNWAY_USERNAME: string;
  RUNWAY_PASSWORD: string;
  RUNWAY_COOKIE?: string;
  RUNWAY_TOKEN?: string;
  prompt: string;
  imageFilePath: string;
};
type Result = "refused-content-error" | "ok";
async function processA(props: P, util: WriteUtil): Promise<Result> {
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 30 * 60 * 1000,
  });
  const page = await browser.newPage();
  try {
    return await processB(props, util, page);
  } finally {
    await browser.close();
  }
}
/**
 * since they don't have an official API yet, this is a fairly fragile browser-based script
 */
async function processB(
  props: P,
  util: WriteUtil,
  page: Page
): Promise<Result> {
  const timeout = 50000;
  page.setDefaultTimeout(timeout);
  if (props.RUNWAY_TOKEN) {
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem("RW_USER_TOKEN", token);
    }, props.RUNWAY_TOKEN);
  }
  if (props.RUNWAY_COOKIE) {
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
    console.log(
      "puppeteer token",
      await page.evaluate(() => localStorage.getItem("RW_USER_TOKEN"))
    );
  }
  {
    const targetPage = page;
    const promises: Promise<unknown>[] = [];
    const startWaitingForEvents = () => {
      promises.push(targetPage.waitForNavigation());
    };
    startWaitingForEvents();
    await targetPage.goto(
      `https://app.runwayml.com/video-tools/teams/${props.RUNWAY_USERNAME}/ai-tools/generative-video`
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
    ])
      .setTimeout(30 * 60 * 1000)
      .click({
        offset: {
          x: 44.1875,
          y: 11,
        },
      });
  }
  console.log("pushed generate, waiting for video");
  let vid;
  // Content error
  while (true) {
    try {
      vid = await page.waitForSelector("video source", {
        timeout: 60 * 1000,
      });
      if (!vid) throw Error("video not found");
      break;
    } catch (e) {
      const ele = await page.$("[class*=ProgressBar__percentage]");
      if (ele) {
        const text = await ele.evaluate((el) => el.textContent);
        console.log("video not ready(?)", "status", text);
        continue;
      }
      const res = await page.$("::-p-aria(Content error)");
      if (res) {
        console.error("content error, they refused to generate");
        return "refused-content-error";
      }
      console.error(
        "no readyness element found, probably need to press gen button (again)",
        props.prompt
      );
      const targetPage = page;
      await Locator.race([
        targetPage.locator("button:not([disabled])::-p-text(Generate)"),
      ])
        .setTimeout(30 * 60 * 1000)
        .click({
          offset: {
            x: 44.1875,
            y: 11,
          },
        });
    }
  }
  console.log("video done!");
  const src = await vid.evaluate((el: HTMLSourceElement) => el.src);
  const ab = await fetch(src).then((res) => res.arrayBuffer());
  await util.writeCompanion("-vid.mp4", new Uint8Array(ab));
  return "ok";
}

export async function step05ImageToVideo(
  apiFromCacheOr: CacheOrComputer,
  config: {
    RUNWAY_USERNAME?: string;
    RUNWAY_PASSWORD?: string;
  },
  prompt: string,
  imageFilePath: string,
  preSleep: () => Promise<void>
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
      await preSleep();
      const result = await processA(full, util);
      return { result };
    }
  );
  return { ...result, videoFilePath: result.meta.cachePrefix + "-vid.mp4" };
}
