import { cleanupOldData } from "./lib/crawlers/cleaner";

async function testCleanup() {
  console.log("🧪 Testing cleanup functionality...\n");

  const result = await cleanupOldData();

  console.log("\n📊 Cleanup Results:");
  console.log("====================");
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  console.log(`Jobs deleted: ${result.deletedJobs}`);
  console.log(`Logs deleted: ${result.deletedLogs}`);
  console.log("====================\n");

  if (result.success) {
    console.log("✅ Cleanup test passed!");
  } else {
    console.log("❌ Cleanup test failed!");
    process.exit(1);
  }
}

testCleanup().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
