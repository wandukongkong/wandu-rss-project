import { defineEventHandler } from "h3";
import RSS from "rss";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default defineEventHandler(async (event) => {
  const url =
    "https://cafe.naver.com/cookieruntoa?iframe_url=/ArticleList.nhn%3Fsearch.clubid=31055592%26search.menuid=1%26search.boardtype=L";

  try {
    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    // 예시: 첫 번째 게시글 제목 가져오기
    const title = $(".article-title").first().text().trim();
    const link = $(".article-title a").first().attr("href");
    const description = $(".article-content").first().text().trim();

    // Example RSS feed
    const feed = new RSS({
      title: "Naver Cafe Content",
      site_url: "https://cafe.naver.com/cookieruntoa",
      feed_url: "https://yourwebsite.com/rss.xml",
    });

    // Example item - 실제 데이터를 기반으로 작성
    feed.item({
      title: title,
      url: `https://cafe.naver.com${link}`, // 실제 URL로 변경
      date: new Date(),
      description: description,
    });

    // Returning the RSS feed as XML
    event.res.setHeader("Content-Type", "application/xml");
    event.res.end(feed.xml({ indent: true }));
  } catch (error) {
    console.error("Fetch error:", error);
    event.res.statusCode = 500;
    event.res.end("Internal Server Error");
  }
});
