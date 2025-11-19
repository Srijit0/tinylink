// src/validators.js

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidCode(code) {
  return CODE_REGEX.test(code);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Always generate 6-character codes within the allowed charset.
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRandomCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[idx];
  }
  return result;
}

module.exports = {
  isValidCode,
  isValidUrl,
  generateRandomCode
};
