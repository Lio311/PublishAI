import { Inngest } from "inngest";

/**
 * Load Testing Script
 * Simulates multiple concurrent users uploading documents at the exact same time
 * to ensure Neon DB handles connections and Inngest queues properly.
 */
async function runLoadTest() {
  const inngest = new Inngest({ id: "publish-ai" });
  
  const concurrentUsers = 5;
  const events = [];

  for (let i = 0; i < concurrentUsers; i++) {
    events.push({
      name: "paper/uploaded",
      data: {
        paperId: `LOAD-TEST-${i + 1}`,
        textContent: `[LOAD TEST ${i + 1}] Analyzing load performance.`,
      },
    });
  }

  console.log(`Firing ${concurrentUsers} concurrent uploads...`);
  await inngest.send(events);
  
  console.log("Load test events dispatched successfully.");
}

runLoadTest().catch(console.error);
