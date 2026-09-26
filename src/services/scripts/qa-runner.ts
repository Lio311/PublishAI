import { runQA } from "../../scripts/qa-runner";
import { runScript } from "../../scripts/env";

export { runQA };

if (require.main === module || process.argv[1]?.endsWith("qa-runner.ts")) {
  runScript("qa-runner", runQA);
}
