const fs = require('fs');
let content = fs.readFileSync('src/__tests__/services/security.test.ts', 'utf8');
content = `import { webcrypto } from "crypto";\nObject.defineProperty(global, 'crypto', { value: webcrypto });\n` + content;
fs.writeFileSync('src/__tests__/services/security.test.ts', content);
