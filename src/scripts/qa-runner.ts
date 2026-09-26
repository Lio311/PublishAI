import { getInngestClient, runScript } from "./env";

/**
 * End-to-End QA Runner Script
 * Generates a massive 50+ page mock document string and programmatically
 * triggers the submission pipeline to verify the system handles load/chunking properly.
 */
export async function runQA(): Promise<void> {
  const inngest = getInngestClient("qa-runner");

  // Determine paperId: allow user override via PAPER_ID env var, otherwise generate unique integer to avoid idempotency drops
  const paperId = process.env.PAPER_ID
    ? parseInt(process.env.PAPER_ID, 10)
    : 990000 + Math.floor(Math.random() * 10000);

  if (isNaN(paperId)) {
    throw new Error("Invalid PAPER_ID environment variable. Must be a valid integer.");
  }

  // Generate a massive text payload (simulating 50+ pages)
  // A standard page is ~3000 characters. 50 pages = 150,000 characters.
  const lipsum =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
  const massiveDocument = lipsum.repeat(2000); // 2000 * ~124 chars = ~248,000 chars, well over 50 pages.

  console.log("📄 Generating 50+ page mock document string...");
  console.log(`📊 Document length: ${massiveDocument.length.toLocaleString()} characters`);
  console.log(`🎯 Target Mock Paper ID: ${paperId}`);

  console.log("⚡ Triggering QA Simulation Event ('paper/uploaded')...");
  try {
    const result = await inngest.send({
      name: "paper/uploaded",
      data: {
        paperId,
        textContent: `[QA TEST MASSIVE DOCUMENT]\n\n${massiveDocument}`,
      },
    });

    console.log("🎉 QA Simulation Event dispatched successfully.");
    console.log(`   Event IDs: ${JSON.stringify(result.ids || [])}`);
    console.log("   Check Inngest Dev Server (http://127.0.0.1:8288) or Inngest Cloud for execution results.");
  } catch (error: any) {
    console.error("❌ Failed to dispatch event to Inngest.");
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

if (require.main === module || process.argv[1]?.endsWith("qa-runner.ts")) {
  runScript("qa-runner", runQA);
}
