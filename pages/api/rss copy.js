import { NextRequest, NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

const LOCAL_CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function getBrowser() {
  if (process.env.VERCEL_ENV === "production") {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
    return browser;
  } else {
    const browser = await puppeteer.launch();
    return browser;
  }
}

export default async function handler(req, res) {
  const browser = await getBrowser();

  const page = await browser.newPage();
  const targetUrl =
    "https://cafe.naver.com/cookieruntoa?iframe_url=/ArticleList.nhn%3Fsearch.clubid=31055592%26search.menuid=1%26search.boardtype=L";

  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // 페이지에서 필요한 데이터를 추출합니다.
  const posts = await page.evaluate(() => {
    const articles = [];
    const items = document.querySelectorAll(".article");
    items.forEach((item) => {
      const title = item.querySelector(".article-title").innerText;
      const link = item.querySelector(".article-title a").href;
      articles.push({ title, link });
    });
    return articles;
  });

  await browser.close();

  // XML 형식으로 변환
  const xmlPosts = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link><![CDATA[${post.link}]]></link>
    </item>
  `
    )
    .join("");

  const xml = `
    <rss version="2.0">
      <channel>
        <title>Naver Cafe Latest Posts</title>
        <link>${targetUrl}</link>
        <description>Latest posts from Naver Cafe</description>
        ${xmlPosts}
      </channel>
    </rss>
  `;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
