// Sets the browser tab title for the current page, e.g. "Employees | Employee Management App".
// Screen readers read the title when the page changes, and it helps users with many tabs.
import { useEffect } from 'react';

const APP_NAME = 'Employee Management App';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}
