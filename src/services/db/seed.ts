import { seedDatabase } from "../../scripts/seed";
import { runScript } from "../../scripts/env";

export { seedDatabase };

// Backward compatibility runner for direct invocation
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  runScript("seed", seedDatabase);
}
