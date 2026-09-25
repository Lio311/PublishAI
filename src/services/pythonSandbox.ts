export async function executePython(script: string, dataUrl: string): Promise<any> {
  console.log(`[PythonSandbox] Executing script with dataUrl: ${dataUrl}`);
  console.log(`[PythonSandbox] Script content:\n${script}`);
  
  // Mock return value for now
  return {
    pValue: 0.21,
    mean: 4.5,
    valid: false
  };
}
