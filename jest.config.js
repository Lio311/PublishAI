/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest.js')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  setupFiles: ["<rootDir>/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: './jest.custom-env.js',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
}

module.exports = async () => {
  const nextJestConfig = await createJestConfig(config)()
  
  if (nextJestConfig.transformIgnorePatterns) {
    nextJestConfig.transformIgnorePatterns = nextJestConfig.transformIgnorePatterns.map(pattern => {
      if (typeof pattern === 'string' && pattern.includes('geist|')) {
        return pattern.replaceAll('geist|', 'geist|ai|@ai-sdk|@modelcontextprotocol|@workflow|@langchain|langsmith|e2b|chalk|');
      }
      return pattern;
    });
  }
  
  nextJestConfig.moduleNameMapper = {
    ...nextJestConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1'
  };
  
  return nextJestConfig
}
