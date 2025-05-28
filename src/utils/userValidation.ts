
// Username validation utilities
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  // Check length
  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmedUsername.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters long' };
  }

  // Check format - only allow alphanumeric, dots, underscores, and hyphens
  const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' };
  }

  // Check that it doesn't start or end with special characters
  if (trimmedUsername.startsWith('.') || trimmedUsername.startsWith('_') || trimmedUsername.startsWith('-') ||
      trimmedUsername.endsWith('.') || trimmedUsername.endsWith('_') || trimmedUsername.endsWith('-')) {
    return { isValid: false, error: 'Username cannot start or end with special characters' };
  }

  // Check for consecutive special characters
  if (/[._-]{2,}/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username cannot contain consecutive special characters' };
  }

  return { isValid: true };
};

export const sanitizeUsername = (username: string): string => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
    .replace(/[._-]+/g, (match) => match[0]) // Replace consecutive special chars with single
    .replace(/^[._-]+|[._-]+$/g, ''); // Remove leading/trailing special chars
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const generateEmailFromUsername = (username: string): string => {
  const sanitized = sanitizeUsername(username);
  return `${sanitized}@alohacardshop.com`;
};
