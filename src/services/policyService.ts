import { db } from "./db";
import { journals } from "./db/schema";
import { ilike } from "drizzle-orm";

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
    
    if (!journalName) {
      throw new Error('Journal name is required to check policy.');
    }

    const journal = await db.query.journals.findFirst({
      where: ilike(journals.name, `%${journalName}%`)
    });

    if (!journal) {
      return {
        isCompliant: true,
        disclosureString: `AI Usage Declaration: The authors utilized AI assistance for ${aiUsageDetails}. All data and conclusions have been verified by the human authors.`,
        restrictions: ['AI must be disclosed in the methodology or acknowledgements section']
      };
    }

    const rules = (journal.rules as any) || {};

    if (rules.strict) {
      return {
        isCompliant: false,
        disclosureString: '',
        restrictions: rules.restrictions || ['No generative AI allowed in writing or data analysis']
      };
    }

    return {
      isCompliant: rules.isCompliant !== undefined ? rules.isCompliant : true,
      disclosureString: rules.disclosureString 
        ? rules.disclosureString.replace('{aiUsageDetails}', aiUsageDetails)
        : `Disclosure: Generative AI tools were used for ${aiUsageDetails}. The authors take full responsibility for the content.`,
      restrictions: rules.restrictions || ['AI cannot be listed as an author', 'Generated images must be explicitly declared']
    };
  }
}

export const policyService = new PolicyService();
