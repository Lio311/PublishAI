import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  setupFiles: ["<rootDir>/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: './jest.custom-env.js',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
}

export default async () => {
  const nextJestConfig = await createJestConfig(config)()
  
  if (nextJestConfig.transformIgnorePatterns) {
    nextJestConfig.transformIgnorePatterns = nextJestConfig.transformIgnorePatterns.map(pattern => {
      if (typeof pattern === 'string' && pattern.includes('geist|')) {
        return pattern.replaceAll('geist|', 'geist|ai|@ai-sdk|@modelcontextprotocol|@workflow|');
      }
      return pattern;
    });
  }
  
  // Manually add moduleNameMapper to bypass Next.js potential bugs
  nextJestConfig.moduleNameMapper = {
    ...nextJestConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1'
  };
  
  return nextJestConfig
}
