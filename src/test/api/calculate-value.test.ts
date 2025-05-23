
import { describe } from 'vitest';

// Import all test suites
import './tests/method-validation.test';
import './tests/input-validation.test';
import './tests/calculation.test';
import './tests/error-handling.test';

// Shared mock setup
import './tests/shared-mocks';

// Main test suite that serves as an entry point
describe('calculate-value API Tests', () => {
  // All tests are now imported from separate files
});
