import axios from "axios";
import * as cheerio from "cheerio";

async function testV2EXDetail() {
  try {
    const response = await axios.get("https://www.v2ex.com/go/jobs?tab=remote", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    console.log("=== Analyzing V2EX job item structure ===\n");

    // Find each topic-link and its parent structure
    $(".topic-link")
      .slice(0, 3)
      .each((i, el) => {
        console.log(`\n--- Job ${i + 1} ---`);
        const $link = $(el);
        const title = $link.text().trim();
        const href = $link.attr("href");

        console.log(`Title: ${title}`);
        console.log(`Href: ${href}`);

        // Get parent cell
        const $cell = $link.closest(".cell");
        console.log(`Parent classes: ${$cell.attr("class")}`);

        // Try to find author and time info
        const $table = $link.closest("table");
        if ($table.length) {
          console.log("Found table parent");

          // Look for username
          const $username = $table.find("a[href^='/member/']");
          if ($username.length) {
            console.log(`Author: ${$username.text().trim()}`);
          }

          // Look for time info
          const $timeSpans = $table.find("span.topic_info");
          $timeSpans.each((j, span) => {
            console.log(`Topic info ${j}: ${$(span).text().trim()}`);
          });
        }

        // Get all text content from the cell
        const cellText = $cell.text().trim().replace(/\s+/g, " ").substring(0, 200);
        console.log(`Cell preview: ${cellText}...`);
      });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

testV2EXDetail();
