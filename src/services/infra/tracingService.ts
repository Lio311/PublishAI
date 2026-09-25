import { Langfuse } from 'langfuse-node';

// Initialize Langfuse tracing. Assumes LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, 
// and optionally LANGFUSE_BASEURL are in the environment.
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
});

/**
 * Wraps a node function with Langfuse tracing, creating a trace span around its execution.
 * 
 * @param nodeName - The name of the node/step to trace.
 * @param nodeFunction - The function representing the node's execution logic.
 * @returns A wrapped function that traces the execution.
 */
export function withTracing<TArgs extends any[], TReturn>(
  nodeName: string,
  nodeFunction: (...args: TArgs) => Promise<TReturn> | TReturn
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    // Create a trace or span for the node execution
    const trace = langfuse.trace({
      name: nodeName,
    });
    
    const span = trace.span({
      name: `${nodeName}_execution`,
      input: args,
    });

    try {
      // Execute the node function
      const result = await nodeFunction(...args);
      
      // Update span with successful result
      span.update({
        output: result,
      });
      
      return result;
    } catch (error) {
      // Update span with error
      span.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // End the span
      span.end();
    }
  };
}
