import axios from "axios";

async function testV2EXAPI() {
  console.log("=== Testing V2EX API ===\n");

  // Test 1: Latest topics (v1 API - no auth required)
  try {
    console.log("1. Testing /api/topics/latest.json (V1 API)");
    const latest = await axios.get("https://www.v2ex.com/api/topics/latest.json");
    console.log(`   ✓ Success! Found ${latest.data.length} topics`);
    console.log(`   Sample topic:`, {
      id: latest.data[0].id,
      title: latest.data[0].title,
      node: latest.data[0].node,
    });
  } catch (error) {
    console.log(`   ✗ Failed:`, error instanceof Error ? error.message : error);
  }

  // Test 2: Topics from jobs node
  try {
    console.log("\n2. Testing /api/topics/show.json?node_name=jobs");
    const jobs = await axios.get("https://www.v2ex.com/api/topics/show.json?node_name=jobs");
    console.log(`   ✓ Success! Found ${jobs.data.length} job topics`);
    if (jobs.data.length > 0) {
      console.log(`   Sample job:`, {
        id: jobs.data[0].id,
        title: jobs.data[0].title,
        content: jobs.data[0].content?.substring(0, 100),
        created: jobs.data[0].created,
      });
    }
  } catch (error) {
    console.log(`   ✗ Failed:`, error instanceof Error ? error.message : error);
  }

  // Test 3: Node info
  try {
    console.log("\n3. Testing /api/nodes/show.json?name=jobs");
    const node = await axios.get("https://www.v2ex.com/api/nodes/show.json?name=jobs");
    console.log(`   ✓ Success! Node info:`, {
      name: node.data.name,
      title: node.data.title,
      topics: node.data.topics,
    });
  } catch (error) {
    console.log(`   ✗ Failed:`, error instanceof Error ? error.message : error);
  }

  // Test 4: V2 API without token (expected to fail)
  try {
    console.log("\n4. Testing V2 API /api/v2/nodes/jobs/topics (without token)");
    const v2 = await axios.get("https://www.v2ex.com/api/v2/nodes/jobs/topics");
    console.log(`   ✓ Success!`, v2.data);
  } catch (error: any) {
    console.log(`   ✗ Failed (expected):`, error.response?.status, error.response?.statusText);
  }
}

testV2EXAPI();
