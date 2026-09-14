import { CodeInterpreter } from '@e2b/code-interpreter';

export async function runPythonInSandbox(
  code: string,
  dataFiles: Array<{ filename: string; url: string }>
): Promise<{ logs: string; results: any; chartUrls: string[] }> {
  let sandbox: CodeInterpreter | null = null;
  
  try {
    // 1. Initialize E2B Sandbox
    sandbox = await CodeInterpreter.create();

    // 2. Download files from URLs and write to Sandbox
    for (const file of dataFiles) {
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${file.url}`);
      }
      const buffer = await response.arrayBuffer();
      // Write the file to the sandbox workspace
      await sandbox.writeBytes(file.filename, new Uint8Array(buffer));
    }

    // 3. Execute `code`
    const execution = await sandbox.notebook.execCell(code);

    // 4. Collect standard output, errors
    const logs = [
      ...execution.logs.stdout,
      ...execution.logs.stderr,
    ].join('\n');

    const results = {}; 
    const chartUrls: string[] = [];

    // 5. Upload generated charts to storage
    // CodeInterpreter captures results, including images (e.g. matplotlib plots)
    for (const result of execution.results) {
      if (result.png) {
        // In a real scenario we'd upload the buffer to Vercel Blob / S3
        // For demonstration, we create a mock URL or base64 data URI
        const chartUrl = `data:image/png;base64,${result.png}`;
        chartUrls.push(chartUrl);
      }
    }

    return { logs, results, chartUrls };
  } catch (error) {
    console.error("Error in runPythonInSandbox:", error);
    throw error;
  } finally {
    // 6. Close Sandbox
    if (sandbox) {
      await sandbox.close();
    }
  }
}
