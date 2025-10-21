import { runCrawlers } from "../lib/crawlers/scheduler";

async function main() {
  console.log("Starting crawler...");
  const results = await runCrawlers();
  console.log("Crawler finished:");
  console.log(JSON.stringify(results, null, 2));
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
