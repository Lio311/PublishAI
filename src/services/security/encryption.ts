import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes (96 bits) standard for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes (128 bits) standard authentication tag
const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Gets the encryption key from the environment.
 * Expects a 32-byte hex string (64 characters).
 */
function getKey(): Buffer {
  const keyHex = process.env.MASTER_ENCRYPTION_KEY?.trim();
  if (!keyHex) {
    throw new Error("MASTER_ENCRYPTION_KEY environment variable is not set.");
  }
  if (keyHex.length !== 64 || !HEX_REGEX.test(keyHex)) {
    throw new Error("MASTER_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).");
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Validates whether a value matches the encrypted "iv:authTag:ciphertext" format.
 * @param value The value to check
 */
export function isEncrypted(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  const [ivHex, authTagHex, ciphertext] = parts;
  if (ivHex.length !== IV_LENGTH * 2 || !HEX_REGEX.test(ivHex)) return false;
  if (authTagHex.length !== AUTH_TAG_LENGTH * 2 || !HEX_REGEX.test(authTagHex)) return false;
  if (ciphertext.length > 0 && (!HEX_REGEX.test(ciphertext) || ciphertext.length % 2 !== 0)) return false;
  return true;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param plaintext The text to encrypt
 * @returns Encrypted string in the format "iv:authTag:ciphertext" (all hex)
 */
export function encrypt(plaintext: string): string {
  if (typeof plaintext !== "string") {
    throw new TypeError("Plaintext must be a string.");
  }
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
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
  if (encryptedString === "" || encryptedString == null) {
    return "";
  }

  if (typeof encryptedString !== "string") {
    throw new TypeError("Encrypted string must be a string.");
  }
  
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format. Expected iv:authTag:ciphertext");
  }
  
  const [ivHex, authTagHex, ciphertext] = parts;

  if (ivHex.length !== IV_LENGTH * 2 || !HEX_REGEX.test(ivHex)) {
    throw new Error("Invalid IV format or length. Expected 24 hex characters.");
  }

  if (authTagHex.length !== AUTH_TAG_LENGTH * 2 || !HEX_REGEX.test(authTagHex)) {
    throw new Error("Invalid authentication tag format or length. Expected 32 hex characters.");
  }

  if (ciphertext.length > 0 && (!HEX_REGEX.test(ciphertext) || ciphertext.length % 2 !== 0)) {
    throw new Error("Invalid ciphertext format. Expected even-length hex string.");
  }
  
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes("Invalid") || err.message.includes("Expected") || err.message.includes("MASTER_ENCRYPTION_KEY"))) {
      throw err;
    }
    throw new Error("Decryption failed. The data may have been tampered with or the encryption key is incorrect.");
  }
}
