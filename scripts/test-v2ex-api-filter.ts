import axios from "axios";

async function testFiltering() {
  const response = await axios.get("https://www.v2ex.com/api/topics/show.json?node_name=jobs");
  const topics = response.data;

  console.log(`\n=== Analyzing ${topics.length} job topics ===\n`);

  const remoteKeywords = [
    "远程",
    "remote",
    "居家",
    "在家",
    "home office",
    "wfh",
    "work from home",
    "telecommute",
  ];

  let remoteCount = 0;
  let nonRemoteCount = 0;

  topics.forEach((topic: any) => {
    const titleLower = topic.title.toLowerCase();
    const contentLower = (topic.content || "").toLowerCase();
    const isJobSeeking = titleLower.includes("求职") || titleLower.includes("[求职]");

    const isRemote = remoteKeywords.some(
      (keyword) => titleLower.includes(keyword) || contentLower.includes(keyword)
    );

    if (isJobSeeking) {
      console.log(`[SKIPPED - Job Seeking] ${topic.title}`);
    } else if (isRemote) {
      remoteCount++;
      console.log(`[✓ REMOTE] ${topic.title}`);
    } else {
      nonRemoteCount++;
      console.log(`[✗ Not Remote] ${topic.title}`);
    }
  });

  console.log(`\n--- Summary ---`);
  console.log(`Remote jobs: ${remoteCount}`);
  console.log(`Non-remote jobs: ${nonRemoteCount}`);
  console.log(
    `\nNote: V2EX API only returns ~10 latest topics. For more jobs, we need pagination or multiple requests.`
  );
}

testFiltering();
