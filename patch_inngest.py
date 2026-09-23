import re

with open("src/inngest/functions/processSubmissionOutcome.ts", "r") as f:
    content = f.read()

old_code = """      await step.run('extract-reviewer-analytics', async () => {
        if (!comments) return;
        // Fetch journalId for the submission
        const result = await db.execute(sql`SELECT journal_id FROM submissions s JOIN paper_versions pv ON s.paper_id = pv.paper_id WHERE s.id = ${submissionId} LIMIT 1`);
        // Alternatively, if submissions doesn't have journal_id directly, we might need to get it differently.
        // Actually logFeedbackOutcome fetches it from submissions directly: SELECT "journal_id" FROM "submissions"
        const subs = (await db.execute(sql`SELECT "journal_id" FROM "submissions" WHERE "id" = ${submissionId}`)).rows;
        if (subs.length > 0 && subs[0].journal_id) {
          await extractReviewerFeedback(submissionId, subs[0].journal_id as number, outcome as any, comments);
        }
      });"""

new_code = """      await step.run('extract-reviewer-analytics', async () => {
        if (!comments) return;
        // Fetch journalId via papers table
        const res = await db.execute(sql`
          SELECT p.target_journal_id 
          FROM submissions s 
          JOIN papers p ON s.paper_id = p.id 
          WHERE s.id = ${submissionId}
        `);
        const target_journal_id = res.rows[0]?.target_journal_id;
        
        if (target_journal_id) {
          await extractReviewerFeedback(submissionId, target_journal_id as number, outcome as any, comments);
        }
      });"""

content = content.replace(old_code, new_code)

with open("src/inngest/functions/processSubmissionOutcome.ts", "w") as f:
    f.write(content)
