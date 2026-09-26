import fs from 'fs';

let content = fs.readFileSync('src/services/security/csrf.ts', 'utf8');

// Remove import crypto from "crypto";
content = content.replace(/import crypto from "crypto";\n*/g, '');

// Replace generateCsrfToken
const newGenerateCsrfToken = `
export async function generateCsrfToken(sessionId: string, secret?: string): Promise<string> {
  const tokenSecret =
    secret ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-csrf-secret";
  const timestamp = Date.now().toString();
  const data = \`\${sessionId}:\${timestamp}\`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const hmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return \`\${data}:\${hmac}\`;
}
`;

content = content.replace(/export function generateCsrfToken[\s\S]*?(?=export function verifyCsrfToken)/, newGenerateCsrfToken + "\n");

// Replace verifyCsrfToken
const newVerifyCsrfToken = `
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyCsrfToken(
  token: string,
  sessionId: string,
  secret?: string,
  maxAgeMs = 2 * 60 * 60 * 1000
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [tokSessionId, tokTimestamp, tokHmac] = parts;
  if (tokSessionId !== sessionId) return false;

  const timestampNum = parseInt(tokTimestamp, 10);
  if (isNaN(timestampNum) || Date.now() - timestampNum > maxAgeMs) {
    return false;
  }

  const tokenSecret =
    secret ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-csrf-secret";
    
  const data = \`\${tokSessionId}:\${tokTimestamp}\`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const expectedHmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqualStr(tokHmac, expectedHmac);
}
`;

content = content.replace(/export function verifyCsrfToken[\s\S]*?(?=$)/, newVerifyCsrfToken);

fs.writeFileSync('src/services/security/csrf.ts', content);
console.log("Patched csrf.ts");
