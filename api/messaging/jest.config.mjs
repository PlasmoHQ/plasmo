/**
 * @type {import('@jest/types').Config.InitialOptions}
 */

const config = {
  clearMocks: true,
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+.ts?$": [
      "ts-jest",
      {
        useESM: true,
        isolatedModules: true
      }
    ]
  },
  testMatch: ["**/*.test.ts"],
  verbose: true,
}
export default config
