// Turns any failed API call into text that is safe and friendly to show.
// Every page uses these two helpers, so errors look the same everywhere, and we never
// render raw error objects, stack traces or the backend's "debug" field.

// One message for the whole request (shown in an Alert or a toast).
// `overrides` lets a page use its own wording for a status, e.g. { 401: 'Invalid ...' }.
export function getErrorMessage(error, overrides = {}) {
  if (!error) return '';

  // No response at all: the request never reached the server or timed out.
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'The server took too long to respond. Please try again.';
    }
    return "Can't reach the server. Check your connection and try again.";
  }

  const { status, data, headers } = error.response;
  if (overrides[status]) return overrides[status];

  switch (status) {
    case 400:
      // "Validation failed" is generic; the field messages explain the details.
      return data?.message && data.message !== 'Validation failed'
        ? data.message
        : 'Please check the highlighted fields.';
    case 401:
      return 'Your session has expired, please log in again';
    case 403:
    case 404:
      return "This item was not found or you don't have access to it.";
    case 409:
      return 'That record already exists.';
    case 413:
      return 'The data you sent is too large.';
    case 429:
      return getRateLimitMessage(headers, data);
    case 503:
      return 'The service is temporarily unavailable. Please try again in a moment.';
    default:
      if (status >= 500) return 'Something went wrong on our side. Please try again later.';
      return 'Something went wrong. Please try again.';
  }
}

// The backend sends Retry-After (in seconds) with a 429; we turn it into minutes.
// (The backend's CORS settings expose this header so the browser lets us read it.)
function getRateLimitMessage(headers, data) {
  const seconds = Number(headers?.['retry-after']);
  if (seconds > 0) {
    const minutes = Math.ceil(seconds / 60);
    return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  }
  return data?.message || 'Too many requests. Please wait a moment and try again.';
}

// Field-level messages from the backend's errors[] array, as { fieldName: message }.
// Only the first message per field is kept.
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};

  const fieldErrors = {};
  for (const item of list) {
    if (item?.field && typeof item.message === 'string' && !fieldErrors[item.field]) {
      fieldErrors[item.field] = item.message;
    }
  }
  return fieldErrors;
}
