/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  rootDir: '../tests',
  testEnvironment: 'node',
  verbose: true,
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  setupFiles: ['fake-indexeddb/auto'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './config/tsconfig.jest.json',
        diagnostics: {
          ignoreCodes: [151001],
        },
      },
    ],
  },
};
