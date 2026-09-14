import { Inngest } from "inngest";

/**
 * End-to-End Simulation Script
 * Simulates a large document upload to ensure the pipeline handles chunks without timeout.
 */
async function runQA() {
  const inngest = new Inngest({ id: "publish-ai" });
  
  // Generate a massive text payload (simulating 20+ pages)
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(2000); 

  console.log("Triggering QA Simulation Event...");
  await inngest.send({
    name: "paper/uploaded",
    data: {
      paperId: "QA-TEST-999",
      textContent: `[QA TEST LARGE DOCUMENT]\n\n${lorem}`,
    },
  });

  console.log("QA Simulation Event dispatched. Check Inngest Dev Server for results.");
}

runQA().catch(console.error);
