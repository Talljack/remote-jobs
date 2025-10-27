import axios from "axios";

const V2EX_TOKEN = "f9e30d83-41e4-4675-ad0c-264f7ab0028d";

async function checkStructure() {
  const response = await axios.get("https://www.v2ex.com/api/v2/nodes/jobs/topics?p=1", {
    headers: {
      Authorization: `Bearer ${V2EX_TOKEN}`,
      Accept: "application/json",
    },
  });

  const topic = response.data.result[0];
  console.log("Topic structure:");
  console.log(JSON.stringify(topic, null, 2));
}

checkStructure();
