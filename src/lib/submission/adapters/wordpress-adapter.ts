/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { ConnectionTestResult, SubmissionPayload, SubmissionResult } from "../types";

export class WordPressAdapter {
  private siteUrl: string;
  private authHeader: string;

  constructor(siteUrl: string, username: string, appPassword: string) {
    // Remove trailing slash if present
    this.siteUrl = siteUrl.replace(/\/$/, "");
    const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Tests the connection to the WordPress REST API by fetching the current user.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/users/me`, {
        method: "GET",
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: "Invalid credentials or insufficient permissions." };
        }
        if (response.status === 404) {
          return { success: false, message: "REST API not enabled on this WordPress site." };
        }
        return { success: false, message: `HTTP Error: ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        message: "Connected successfully",
        userDisplayName: data.name,
        userRole: data.roles?.[0] || "Author",
        serverInfo: {
          platform: "WordPress",
          siteName: this.siteUrl,
        },
      };
    } catch (error: any) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }

  /**
   * Submits the paper to WordPress as a post.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      // Create post data
      const postData = {
        title: payload.title,
        content: payload.content,
        excerpt: payload.abstract,
        status: payload.publishMode, // "draft" or "publish"
        // Convert keywords to tags if we had a mapping, but for now we just pass them in meta or standard categories if supported.
        // Assuming custom meta fields for authors and cover letter
        meta: {
          cover_letter: payload.coverLetter || "",
          authors: JSON.stringify(payload.authors),
          article_type: payload.articleType,
        }
      };

      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData ? JSON.stringify(errorData) : `HTTP Error: ${response.status}`,
          rawResponse: errorData
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        postId: String(data.id),
        postUrl: data.link,
        confirmationId: `WP-${data.id}`,
        rawResponse: data
      };
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }
}
