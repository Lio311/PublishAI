import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  setupFiles: ["<rootDir>/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: './jest.custom-env.js',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default async () => {
  const nextJestConfig = await createJestConfig(config)()
  
  // Safely inject transformIgnorePatterns by modifying Next.js defaults
  if (nextJestConfig.transformIgnorePatterns) {
    nextJestConfig.transformIgnorePatterns = nextJestConfig.transformIgnorePatterns.map(pattern => {
      if (typeof pattern === 'string' && pattern.includes('geist|')) {
        return pattern.replaceAll('geist|', 'geist|ai|@ai-sdk|@modelcontextprotocol|@workflow|');
      }
      return pattern;
    });
  }
  
  return nextJestConfig
}
