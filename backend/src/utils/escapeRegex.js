// Escapes every character that has a special meaning in a regular expression,
// so user input is matched as plain text.
// Without this, a search like ".*" would match everything, and a crafted pattern
// such as "(a+)+$" could make MongoDB do a very slow regex (a denial-of-service risk).
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // "$&" = the matched character
}

module.exports = escapeRegex;
