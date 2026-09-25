import * as fs from 'fs';

let content = fs.readFileSync('src/inngest/functions/submission.ts', 'utf-8');

const replacement = `
    if (result.status === "requires_captcha") {
      const captchaEvent = await step.waitForEvent("wait-for-captcha", {
        event: "submission.captcha.solved",
        timeout: "24h",
        match: "data.submissionId",
      });

      if (!captchaEvent) {
        throw new Error("Captcha not solved within 24 hours");
      }

      await step.run("resume-submission-after-captcha", async () => {
        const sub = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
          with: { connection: true } as any,
        });
        const conn = (sub as any)?.connection;
        if (!conn) throw new Error("No connection found for submission");

        const { decrypt } = await import("@/services/security/encryption");
        
        // Pass the solution back to the navigator to continue
        return await runSubmissionWorkflow(submissionId.toString(), {
          siteUrl: conn.siteUrl,
          username: decrypt(conn.encryptedUsername),
          password: decrypt(conn.encryptedPassword),
          captchaSolution: captchaEvent.data.solution,
        } as any);
      });
    }
`;

content = content.replace(/if \(result\.status === "requires_captcha"\) \{[\s\S]*?throw new Error\("Captcha not solved within 24 hours"\);\s*\n\s*\}\s*\n\s*\}/m, replacement.trim() + '\n    }');

fs.writeFileSync('src/inngest/functions/submission.ts', content);
