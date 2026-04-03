export default {
  testRunner: "jest",
  jest: {
    configFile: "jest.config.js",
    enableFindRelatedTests: false,
  },
  mutate: ["components/**/*.{ts,tsx}", "!components/**/*.d.ts", "!components/**/*.test.{ts,tsx}"],
  reporters: ["html", "json", "clear-text"],
  coverageAnalysis: "off",
  logLevel: "warn"
};
