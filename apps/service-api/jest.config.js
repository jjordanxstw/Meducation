/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@medical-portal/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
  // v8 provider avoids babel-plugin-istanbul/test-exclude, which breaks under
  // this repo's global minimatch@9 override.
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'lcov'],
  coverageDirectory: '../coverage',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
};
