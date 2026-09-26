import { getInngestClient, runScript } from "./env";

/**
 * Load Testing Script
 * Simulates multiple concurrent users uploading documents at the exact same time
 * to ensure Neon DB handles connections and Inngest queues properly.
 */
export async function runLoadTest(): Promise<void> {
  const inngest = getInngestClient("load-test");

  const concurrentUsers = process.env.CONCURRENT_USERS
    ? parseInt(process.env.CONCURRENT_USERS, 10)
    : 5;

  if (isNaN(concurrentUsers) || concurrentUsers <= 0) {
    throw new Error("Invalid CONCURRENT_USERS environment variable. Must be a positive integer.");
  }

  // Base integer ID to satisfy Inngest schema (z.number().int()) and avoid idempotency collisions across runs
  const basePaperId = process.env.BASE_PAPER_ID
    ? parseInt(process.env.BASE_PAPER_ID, 10)
    : 800000 + (Math.floor(Date.now() / 1000) % 100000);

  const events = [];

  for (let i = 0; i < concurrentUsers; i++) {
    const paperId = basePaperId + i;
    events.push({
      name: "paper/uploaded",
      data: {
        paperId,
        textContent: `[LOAD TEST #${i + 1}] Analyzing load performance for simulated paper ${paperId}.`,
      },
    });
  }

  console.log(`🚀 Dispatching ${concurrentUsers} concurrent paper upload events...`);
  console.log(`📋 Paper ID range: ${basePaperId} - ${basePaperId + concurrentUsers - 1}`);

  try {
    const result = await inngest.send(events);
    console.log("🎉 Load test events dispatched successfully.");
    console.log(`   Dispatched event count: ${result.ids?.length ?? events.length}`);
    console.log("   Check Inngest Dev Server or Inngest Cloud for pipeline execution.");
  } catch (error: any) {
    console.error("❌ Failed to dispatch load test events to Inngest.");
    if (error?.message?.includes("fetch failed") || error?.code === "ECONNREFUSED") {
      console.error(
        "💡 Hint: Inngest Dev Server might not be running. Start it with:\n" +
          "   npx inngest-cli@latest dev -u http://localhost:3000/api/inngest\n" +
          "   Or configure INNGEST_EVENT_KEY if targeting Inngest Cloud."
      );
    }
    throw error;
  }
}

if (require.main === module || process.argv[1]?.endsWith("load-test.ts")) {
  runScript("load-test", runLoadTest);
}
