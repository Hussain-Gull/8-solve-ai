import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@ai-saas-admin/types(.*)$': '<rootDir>/../../packages/types/src$1'
  }
};

export default config;


