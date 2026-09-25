import { Sandbox } from '@e2b/code-interpreter';

export interface SandboxExecutionResult {
  conclusions: string;
  plots: string[]; // Base64 encoded plots
  success: boolean;
  error?: string;
}

export class SandboxService {
  /**
   * Executes a Python script over an uploaded CSV to generate plots and conclusions.
   * @param pythonScript The Python script to execute.
   * @param csvData The content of the uploaded CSV file.
   * @returns Generated plots and statistical conclusions.
   */
  public async executeDataScienceTask(
    pythonScript: string,
    csvData: string
  ): Promise<SandboxExecutionResult> {
    if (!pythonScript || !csvData) {
      return {
        success: false,
        conclusions: '',
        plots: [],
        error: 'Missing pythonScript or csvData'
      };
    }

    try {
      const sandbox = await Sandbox.create();
      
      // Write the CSV data to a file inside the sandbox
      // We use data.csv as a standard filename for the generated scripts
      await sandbox.files.write('data.csv', csvData);

      // Run the Python script
      const execution = await sandbox.runCode(pythonScript);
      
      // execution.results contains visual outputs like charts, display calls
      const plots = execution.results
        .filter(r => !!r.png)
        .map(r => r.png as string);

      // execution.logs contains stdout/stderr
      const logs = [
        ...execution.logs.stdout,
        ...execution.logs.stderr
      ].join('\n');
      
      const conclusions = logs || 'No output generated.';

      // Clean up the sandbox
      await sandbox.kill();

      if (execution.error) {
        return {
          success: false,
          conclusions: conclusions,
          plots,
          error: `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`
        };
      }

      return {
        success: true,
        conclusions: conclusions,
        plots
      };
    } catch (error) {
      console.error('Error executing in sandbox:', error);
      return {
        success: false,
        conclusions: '',
        plots: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const sandboxService = new SandboxService();
