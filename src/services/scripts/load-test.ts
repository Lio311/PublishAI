import { runLoadTest } from "../../scripts/load-test";
import { runScript } from "../../scripts/env";

export { runLoadTest };

if (require.main === module || process.argv[1]?.endsWith("load-test.ts")) {
  runScript("load-test", runLoadTest);
}
