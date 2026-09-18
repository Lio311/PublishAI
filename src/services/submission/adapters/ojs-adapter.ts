/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionTestResult, SubmissionPayload, SubmissionResult } from "../connection-types";

export class OJSAdapter {
  private siteUrl: string;
  private apiToken: string;

  constructor(siteUrl: string, apiToken: string) {
    this.siteUrl = siteUrl.replace(/\/$/, "");
    this.apiToken = apiToken;
  }

  /**
   * Tests the connection to OJS API.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${this.siteUrl}/api/v1/users/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: "Invalid API token or insufficient permissions." };
        }
        if (response.status === 404) {
          return { success: false, message: "OJS REST API not enabled or incorrect URL." };
        }
        return { success: false, message: `HTTP Error: ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        message: "Connected successfully",
        userDisplayName: `${data.givenName} ${data.familyName}`.trim(),
        userRole: "Author", // In OJS, roles are complex, default to Author
        serverInfo: {
          platform: "OJS",
          siteName: this.siteUrl,
        },
      };
    } catch (error: any) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }

  /**
   * Submits the paper to OJS.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      // Step 1: Create a new submission (minimum payload)
      // OJS typically requires locale and sectionId. 
      // For this simplified version, we assume sectionId 1 and locale "en_US".
      const initResponse = await fetch(`${this.siteUrl}/api/v1/submissions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          locale: "en_US",
          sectionId: 1
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => null);
        return {
          success: false,
          error: errorData ? JSON.stringify(errorData) : `HTTP Error: ${initResponse.status}`,
          rawResponse: errorData
        };
      }

      const submissionData = await initResponse.json();
      const submissionId = submissionData.id;

      // Step 2: Update the submission with metadata
      const updateResponse = await fetch(`${this.siteUrl}/api/v1/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: { en_US: payload.title },
          abstract: { en_US: payload.abstract },
          // Author processing requires a separate endpoint or specific structure in OJS 3.x
        }),
      });

      if (!updateResponse.ok) {
        return {
          success: false,
          error: `Failed to update metadata. HTTP Error: ${updateResponse.status}`,
          rawResponse: await updateResponse.json().catch(() => null)
        };
      }

      // Step 3 (Simulated): In a real implementation, we would upload the manuscript file using
      // POST /api/v1/submissions/{id}/files

      return {
        success: true,
        postId: String(submissionId),
        confirmationId: `OJS-${submissionId}`,
        rawResponse: submissionData
      };
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }
}
