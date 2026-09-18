import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
// const AUTH_TAG_LENGTH = 16;

/**
 * Gets the encryption key from the environment.
 * Expects a 32-byte hex string (64 characters).
 */
function getKey(): Buffer {
  const keyHex = process.env.MASTER_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("MASTER_ENCRYPTION_KEY environment variable is not set.");
  }
  const keyBuffer = Buffer.from(keyHex, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("MASTER_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).");
  }
  return keyBuffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param plaintext The text to encrypt
 * @returns Encrypted string in the format "iv:authTag:ciphertext" (all hex)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
}

/**
 * Decrypts a ciphertext string encrypted with `encrypt()`.
 * @param encryptedString The encrypted string in the format "iv:authTag:ciphertext"
 * @returns Original plaintext string
 */
export function decrypt(encryptedString: string): string {
  if (!encryptedString) return "";
  
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format. Expected iv:authTag:ciphertext");
  }
  
  const [ivHex, authTagHex, ciphertext] = parts;
  
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext, "hex", "utf8");
  try {
    plaintext += decipher.final("utf8");
  } catch (_err) {
    throw new Error("Decryption failed. The data may have been tampered with or the encryption key is incorrect.");
  }
  
  return plaintext;
}
