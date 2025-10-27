import axios from "axios";

const V2EX_TOKEN = process.env.V2EX_API_TOKEN || "f9e30d83-41e4-4675-ad0c-264f7ab0028d";

async function testV2API() {
  console.log("=== Testing V2EX API v2 ===\n");

  if (!V2EX_TOKEN) {
    console.error("V2EX_API_TOKEN not found!");
    return;
  }

  try {
    console.log("1. Testing authentication and first page");
    const response = await axios.get("https://www.v2ex.com/api/v2/nodes/jobs/topics?p=1", {
      headers: {
        Authorization: `Bearer ${V2EX_TOKEN}`,
        Accept: "application/json",
      },
    });

    console.log("✓ Authentication successful!");
    console.log(`✓ Found ${response.data.result.length} topics on page 1`);
    console.log("\nRate limit info:");
    console.log(`  Limit: ${response.headers["x-rate-limit-limit"]}`);
    console.log(`  Remaining: ${response.headers["x-rate-limit-remaining"]}`);
    console.log(`  Reset: ${response.headers["x-rate-limit-reset"]}`);

    console.log("\nSample topic:");
    const sample = response.data.result[0];
    console.log(`  ID: ${sample.id}`);
    console.log(`  Title: ${sample.title}`);
    console.log(`  Author: ${sample.member.username}`);
    console.log(`  Created: ${new Date(sample.created * 1000).toLocaleString()}`);
    console.log(`  Content preview: ${sample.content?.substring(0, 100)}...`);

    console.log("\n2. Testing page 2");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
    const page2 = await axios.get("https://www.v2ex.com/api/v2/nodes/jobs/topics?p=2", {
      headers: {
        Authorization: `Bearer ${V2EX_TOKEN}`,
        Accept: "application/json",
      },
    });
    console.log(`✓ Page 2: ${page2.data.result.length} topics`);

    console.log("\n3. Checking for remote work keywords");
    const remoteKeywords = ["远程", "remote", "居家", "在家", "wfh"];
    const allTopics = [...response.data.result, ...page2.data.result];
    const remoteJobs = allTopics.filter((topic: any) => {
      const text = (topic.title + " " + (topic.content || "")).toLowerCase();
      return remoteKeywords.some((kw) => text.includes(kw));
    });
    console.log(`✓ Found ${remoteJobs.length} remote jobs out of ${allTopics.length} total`);
  } catch (error: any) {
    console.error("✗ Error:", error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error("  Response:", error.response.data);
    }
  }
}

testV2API();
