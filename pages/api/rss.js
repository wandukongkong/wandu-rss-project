import axios from "axios";
import * as cheerio from "cheerio";

async function fetchDataWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retrying... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // 최대 재시도 횟수에 도달하면 오류를 다시 던집니다.
      }
    }
  }
}

export default async function handler(req, res) {
  const targetUrl =
    "https://cafe.naver.com/cookieruntoa?iframe_url=/ArticleList.nhn%3Fsearch.clubid=31055592%26search.menuid=1%26search.boardtype=L";

  try {
    const html = await fetchDataWithRetry(targetUrl);
    const $ = cheerio.load(html);

    const posts = [];
    $(".article").each((index, element) => {
      const title = $(element).find(".article-title").text();
      const link = $(element).find(".article-title a").attr("href");
      posts.push({ title, link });
    });

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
  } catch (error) {
    console.error("Error fetching or parsing page:", error);
    res.status(500).send("Error generating RSS feed");
  }
}
