/**
 * Mock service for checking journal AI policies and generating disclosures.
 */
export interface PolicyCheckResult {
  isCompliant: boolean;
  disclosureString: string;
  restrictions: string[];
}

export class PolicyService {
  /**
   * Checks a journal's AI policy and generates an appropriate Disclosure string.
   * @param journalName The name of the journal to check.
   * @param aiUsageDetails A description of how AI was used in the research/writing.
   * @returns Compliance status and generated disclosure string.
   */
  public async checkJournalPolicy(
    journalName: string,
    aiUsageDetails: string
  ): Promise<PolicyCheckResult> {
    console.log(`Checking AI policy for journal: ${journalName}`);
    
    // Simulate database lookup / policy evaluation
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!journalName) {
      throw new Error('Journal name is required to check policy.');
    }

    const normalizedJournalName = journalName.toLowerCase();

    // Mock policy rules
    if (normalizedJournalName.includes('nature')) {
      return {
        isCompliant: true,
        disclosureString: `Disclosure: Generative AI tools were used for ${aiUsageDetails}. The authors take full responsibility for the content.`,
        restrictions: ['AI cannot be listed as an author', 'Generated images must be explicitly declared']
      };
    } else if (normalizedJournalName.includes('strict')) {
      return {
        isCompliant: false,
        disclosureString: '',
        restrictions: ['No generative AI allowed in writing or data analysis']
      };
    }

    // Default policy
    return {
      isCompliant: true,
      disclosureString: `AI Usage Declaration: The authors utilized AI assistance for ${aiUsageDetails}. All data and conclusions have been verified by the human authors.`,
      restrictions: ['AI must be disclosed in the methodology or acknowledgements section']
    };
  }
}

export const policyService = new PolicyService();
