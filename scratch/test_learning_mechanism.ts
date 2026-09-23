import { extractUserRewriteFeedback, extractReviewerFeedback, getApplicableRules } from "../src/services/learningService";
import { refineAcademicWriting } from "../src/services/ai/aiService";
import { db } from "../src/services/db";
import { aiSystemFeedback } from "../src/services/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("=== Testing Learning Mechanism ===");
  
  const testUserId = "test-user-123";
  const testJournalId = 999;

  // Clean up any old rules
  await db.delete(aiSystemFeedback).where(eq(aiSystemFeedback.userId, testUserId));
  await db.delete(aiSystemFeedback).where(eq(aiSystemFeedback.journalId, testJournalId));

  console.log("\\n1. Extracting User Rewrite Feedback...");
  const originalText = "The participants were put into groups and we gave them the medicine. Then we saw what happened.";
  const feedback = "Rewrite this so it sounds much more formal and don't use 'we' or 'participants'. Use 'subjects'. This is a general rule for my papers.";
  
  await extractUserRewriteFeedback(testUserId, originalText, feedback, "academic_tone", testJournalId);

  // Check the DB
  const userRules = await db.select().from(aiSystemFeedback).where(eq(aiSystemFeedback.userId, testUserId));
  console.log("Extracted User Rules:", JSON.stringify(userRules, null, 2));

  console.log("\\n2. Extracting Reviewer Feedback...");
  const reviewerComments = "The methodology section completely lacks statistical rigor. We expect at least a power analysis and clear p-value thresholds in this journal.";
  
  await extractReviewerFeedback(1, testJournalId, "rejected", reviewerComments);

  const reviewerRules = await db.select().from(aiSystemFeedback).where(eq(aiSystemFeedback.journalId, testJournalId));
  console.log("Extracted Reviewer Rules:", JSON.stringify(reviewerRules.filter(r => r.sourceType === 'reviewer_feedback'), null, 2));

  console.log("\\n3. Getting Applicable Rules...");
  const rulesText = await getApplicableRules(testUserId, testJournalId);
  console.log("Applicable Rules Text block:\\n", rulesText);

  console.log("\\n4. Testing Refine Academic Writing Integration...");
  // We'll call refineAcademicWriting which internally should fetch the rules.
  // We won't actually execute the AI call (to save time) but we can verify it doesn't crash.
  // Wait, refineAcademicWriting DOES execute the AI call. We'll run it on a small text.
  
  const response = await refineAcademicWriting({
    text: "We tested the subjects with the new drug. It worked good.",
    mode: "academic_tone",
    userId: testUserId,
    journalId: testJournalId
  });
  
  console.log("Refined Text:\\n", response.text);
  console.log("=== Done ===");
}

run().catch(console.error).then(() => process.exit(0));
