/**
 * @type import('jest').Config
 */
const config = {
  setupFiles: ["./jest.setup.js"],
  roots: ["src"],
  testMatch: ["**/*.test.(ts|tsx)"],
  transform: {
    ".(ts|tsx)$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!.*chalk)"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};

module.exports = config;
