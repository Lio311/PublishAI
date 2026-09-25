import { sandboxService } from '../../src/services/sandboxService';

describe('SandboxService', () => {
  it('should successfully execute data science task with valid inputs', async () => {
    const result = await sandboxService.executeDataScienceTask('print("hello")', 'col1,col2\n1,2');
    expect(result.success).toBe(true);
    expect(result.conclusions).toContain('positive correlation');
    expect(result.plots.length).toBeGreaterThan(0);
  });

  it('should return error if pythonScript is missing', async () => {
    const result = await sandboxService.executeDataScienceTask('', 'col1,col2\n1,2');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing pythonScript or csvData');
  });

  it('should return error if csvData is missing', async () => {
    const result = await sandboxService.executeDataScienceTask('print("hello")', '');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing pythonScript or csvData');
  });
});
