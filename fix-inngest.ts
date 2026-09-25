import * as fs from 'fs';

let content = fs.readFileSync('src/inngest/functions/submission.ts', 'utf-8');

content = content.replace(/    }\n    }\n\n    if \(result\.status === "requires_2fa"\)/, '    }\n\n    if (result.status === "requires_2fa")');

fs.writeFileSync('src/inngest/functions/submission.ts', content);
