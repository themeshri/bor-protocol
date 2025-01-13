// Common bad words list - extend this as needed
const BAD_WORDS = [];

// URL regex pattern
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;

// MongoDB injection patterns
const MONGO_INJECTION_PATTERNS = [
  /\$eq/i,
  /\$gt/i,
  /\$gte/i,
  /\$in/i,
  /\$lt/i,
  /\$lte/i,
  /\$ne/i,
  /\$nin/i,
  /\$and/i,
  /\$or/i,
  /\$not/i,
  /\$exists/i,
  /\$type/i,
  /\$expr/i,
  /\$regex/i,
];

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

function validateMessage(message: string): ValidationResult {
  // Check if message is empty or just whitespace
  if (!message || message.trim().length === 0) {
    return { isValid: false, reason: "Message cannot be empty" };
  }

  // Check message length
  if (message.length > 200) {
    return { isValid: false, reason: "Message is too long (max 200 characters)" };
  }

  // Check for bad words
  const containsBadWord = BAD_WORDS.some(word => 
    message.toLowerCase().includes(word.toLowerCase())
  );
  if (containsBadWord) {
    return { isValid: false, reason: "Message contains inappropriate language" };
  }

  // Check for URLs
  if (URL_PATTERN.test(message)) {
    return { isValid: false, reason: "URLs are not allowed in messages" };
  }

  // Check for MongoDB injection attempts
  const containsInjection = MONGO_INJECTION_PATTERNS.some(pattern => 
    pattern.test(message)
  );
  if (containsInjection) {
    return { isValid: false, reason: "Invalid message content" };
  }

  return { isValid: true };
}

function sanitizeMessage(message: string): string {
  // Trim whitespace
  let sanitized = message.trim();
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return sanitized;
}

export { validateMessage, sanitizeMessage };