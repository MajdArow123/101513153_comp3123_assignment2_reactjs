// Returns `value`, but only after it has stopped changing for `delay` ms.
// Used by search: typing "Engineering" sends one request, not one per letter.
// Also returns flush(), which applies the current value straight away (Enter / Search button).
import { useEffect, useState } from 'react';

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Every change restarts the timer; only the last value "survives" the wait.
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const flush = () => setDebounced(value);

  return [debounced, flush];
}
