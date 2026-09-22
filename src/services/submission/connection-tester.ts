/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { ConnectionTestResult } from "./connection-types";
import { WordPressAdapter } from "./adapters/wordpress-adapter";
import { OJSAdapter } from "./adapters/ojs-adapter";
import { EmailAdapter } from "./adapters/email-adapter";
import { EditorialManagerAdapter } from "./adapters/editorial-manager-adapter";

export class ConnectionTester {
  /**
   * Tests a connection to a journal CMS.
   * @param platform "wordpress" or "ojs"
   * @param siteUrl The base URL of the CMS
   * @param username The username or API token
   * @param password The application password (for WordPress)
   * @returns ConnectionTestResult
   */
  static async testConnection(
    platform: string,
    siteUrl: string,
    username: string,
    password?: string
  ): Promise<ConnectionTestResult> {
    try {
      this.validateUrl(siteUrl);
    } catch (err: any) {
      return { success: false, message: err.message };
    }

    if (platform === "wordpress") {
      if (!password) {
        return { success: false, message: "Password is required for WordPress connections." };
      }
      const adapter = new WordPressAdapter(siteUrl, username, password);
      return adapter.testConnection();
    } 
    
    if (platform === "ojs") {
      // For OJS, we use 'username' field to store the API token
      const adapter = new OJSAdapter(siteUrl, username);
      return adapter.testConnection();
    }

    if (platform === "email") {
      // For email: siteUrl = editor email, username = author name, password = author email
      const adapter = new EmailAdapter(siteUrl, username, password || '');
      return adapter.testConnection();
    }

    if (platform === "editorial_manager") {
      // For EM: siteUrl = portal URL, username = API token
      const adapter = new EditorialManagerAdapter(siteUrl, username);
      return adapter.testConnection();
    }

    return { success: false, message: `Unsupported platform: ${platform}` };
  }

  private static validateUrl(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (_e) {
      throw new Error("Invalid URL format.");
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("URL must start with http:// or https://");
    }
  }
}
