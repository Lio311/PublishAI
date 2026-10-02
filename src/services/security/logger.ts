export const secureLogger = {
  error: (message: string, data?: unknown) => {
    const maskSensitiveData = (obj: unknown): unknown => {
      if (!obj) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(maskSensitiveData);
      
      const masked: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
      const sensitiveKeys = ['password', 'key', 'token', 'secret', 'authorization'];
      
      for (const key in masked) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          masked[key] = '***MASKED***';
        } else if (typeof masked[key] === 'object') {
          masked[key] = maskSensitiveData(masked[key]);
        }
      }
      return masked;
    };

    const maskedData = data ? maskSensitiveData(data) : undefined;
    
    if (maskedData) {
      console.error(message, maskedData);
    } else {
      console.error(message);
    }
  }
};
