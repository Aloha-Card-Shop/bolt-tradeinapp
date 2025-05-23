
# API Testing Documentation

## Overview

This directory contains tests for the API endpoints in the application. The tests are organized into two main categories:

1. **Unit Tests** - Testing individual functions and components in isolation
2. **End-to-End (E2E) Tests** - Testing the complete request/response flow

## Testing Structure

```
src/test/api/
├── calculate-value.test.ts     # Main entry point for unit tests
├── calculate-value.e2e.test.ts # Main entry point for E2E tests
├── tests/                      # Unit test implementations
│   ├── method-validation.test.ts
│   ├── input-validation.test.ts
│   ├── calculation.test.ts
│   ├── error-handling.test.ts
│   └── shared-mocks.ts         # Common mocks for unit tests
└── e2e/                        # E2E test implementations
    ├── basic-calculations.test.ts
    ├── game-type-handling.test.ts
    ├── fallback-handling.test.ts
    ├── cache-handling.test.ts
    └── setup.ts                # Common setup for E2E tests
```

## Test Files

### Unit Tests

- **method-validation.test.ts**: Tests HTTP method validation (POST only)
- **input-validation.test.ts**: Tests validation of request body parameters
- **calculation.test.ts**: Tests the core calculation logic
- **error-handling.test.ts**: Tests error handling and fallback mechanisms
- **shared-mocks.ts**: Contains common mocks for database, utilities, and environment variables

### E2E Tests

- **basic-calculations.test.ts**: Tests basic calculation functionality with different game types
- **game-type-handling.test.ts**: Tests game type normalization and handling
- **fallback-handling.test.ts**: Tests fallback behavior for unknown games or out-of-range values
- **cache-handling.test.ts**: Tests the caching mechanism for game settings
- **setup.ts**: Contains test setup, mocks, and helper functions for E2E tests

## Running Tests

To run all tests:

```bash
npm test
```

To run only API tests:

```bash
npm test -- src/test/api
```

To run specific test suites:

```bash
# Run unit tests only
npm test -- src/test/api/calculate-value.test.ts

# Run E2E tests only
npm test -- src/test/api/calculate-value.e2e.test.ts

# Run a specific test file
npm test -- src/test/api/tests/calculation.test.ts
```

## Test Coverage

To generate test coverage report:

```bash
npm test -- --coverage
```

## Debugging Tests

Add the `--inspect` flag to debug tests:

```bash
node --inspect node_modules/.bin/vitest src/test/api
```

Then connect to the debugger using Chrome DevTools or your IDE.

## Best Practices

1. Keep test files small and focused on specific functionality
2. Use descriptive test names that explain what is being tested
3. Organize tests in a hierarchical structure using `describe` and `it` blocks
4. Use common setup and teardown patterns for repetitive test scenarios
5. Mock external dependencies to isolate the code being tested
