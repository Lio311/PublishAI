import { ConnectionTestResult, SubmissionPayload, SubmissionResult } from '../connection-types';

/**
 * Editorial Manager adapter (Aries Systems).
 * Many Elsevier, Wiley, and Springer journals use Editorial Manager.
 * This adapter provides a REST API integration stub.
 * For portals without API access, the RPA pathway should be used instead.
 */
export class EditorialManagerAdapter {
  private siteUrl: string;
  private apiToken: string;

  constructor(siteUrl: string, apiToken: string) {
    this.siteUrl = siteUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  /**
   * Tests connectivity to the Editorial Manager API.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${this.siteUrl}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          message: `Editorial Manager API returned HTTP ${response.status}: ${text.substring(0, 200)}`,
        };
      }

      const data = await response.json().catch(() => null);
      return {
        success: true,
        message: 'Connected to Editorial Manager',
        userDisplayName: data?.displayName || data?.name || undefined,
        userRole: data?.role || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Network error connecting to Editorial Manager: ${error.message}`,
      };
    }
  }

  /**
   * Submits a manuscript via Editorial Manager REST API.
   * Currently a stub — most Editorial Manager instances require RPA submission.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      // Editorial Manager API integration
      // Note: Most EM instances don't expose a public submission API.
      // This stub returns a helpful error directing to the RPA pathway.
      const response = await fetch(`${this.siteUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: payload.title,
          abstract: payload.abstract,
          articleType: payload.articleType,
          keywords: payload.keywords,
          authors: payload.authors,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Editorial Manager API submission failed (HTTP ${response.status}). This portal may require RPA-based submission.`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        postId: data.submissionId?.toString(),
        confirmationId: data.manuscriptId || data.trackingNumber,
        rawResponse: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Editorial Manager submission error: ${error.message}. Consider using the RPA submission pathway.`,
      };
    }
  }
}
