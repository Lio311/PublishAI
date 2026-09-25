import { Inngest } from "inngest";

/**
 * End-to-End QA Runner Script
 * Generates a massive 50+ page mock document string and programmatically
 * triggers the submission pipeline to verify the system handles load/chunking properly.
 */
async function runQA() {
  const inngest = new Inngest({ id: "publish-ai" });
  
  // Generate a massive text payload (simulating 50+ pages)
  // A standard page is ~3000 characters. 50 pages = 150,000 characters.
  const lipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "; 
  const massiveDocument = lipsum.repeat(2000); // 2000 * ~124 chars = ~248,000 chars, well over 50 pages.

  console.log("Generating 50+ page mock document string...");
  console.log(`Document length: ${massiveDocument.length} characters`);

  console.log("Triggering QA Simulation Event (paper/uploaded)...");
  await inngest.send({
    name: "paper/uploaded",
    data: {
      paperId: 999999, // Use a mock integer ID to avoid schema mismatch
      textContent: `[QA TEST MASSIVE DOCUMENT]\n\n${massiveDocument}`,
    },
  });

  console.log("QA Simulation Event dispatched successfully. Check Inngest Dev Server for results.");
}

runQA().catch(console.error);
