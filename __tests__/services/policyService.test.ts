import { policyService } from '../../src/services/policyService';

describe('PolicyService', () => {
  it('should return nature policy when journal is nature', async () => {
    const result = await policyService.checkJournalPolicy('Nature Communications', 'writing assistance');
    expect(result.isCompliant).toBe(true);
    expect(result.disclosureString).toContain('writing assistance');
    expect(result.restrictions).toContain('AI cannot be listed as an author');
  });

  it('should return strict policy when journal is strict', async () => {
    const result = await policyService.checkJournalPolicy('Strict Science', 'data analysis');
    expect(result.isCompliant).toBe(false);
    expect(result.disclosureString).toBe('');
    expect(result.restrictions).toContain('No generative AI allowed in writing or data analysis');
  });

  it('should return default policy for unknown journal', async () => {
    const result = await policyService.checkJournalPolicy('Unknown Journal', 'grammar checking');
    expect(result.isCompliant).toBe(true);
    expect(result.disclosureString).toContain('grammar checking');
    expect(result.restrictions).toContain('AI must be disclosed in the methodology or acknowledgements section');
  });

  it('should throw error if journal name is not provided', async () => {
    await expect(policyService.checkJournalPolicy('', 'grammar checking')).rejects.toThrow('Journal name is required to check policy.');
  });
});
