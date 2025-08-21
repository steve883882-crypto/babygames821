// Environment configuration
export const config = {
  isDevelopment: import.meta.env.DEV,
} as const;

// Type-safe environment variable access
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value || defaultValue || '';
}