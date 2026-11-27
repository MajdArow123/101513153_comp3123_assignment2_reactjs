// The employee list (the first screen after login), with search by department/position.
// The backend only returns the logged-in user's employees, for the list AND for search,
// so nobody else's data can ever appear here. Search always calls the backend; the
// browser never filters the list itself.
//
// The search text lives in the URL (/employees?department=eng&position=dev), so a
// search survives a refresh, and "Back" from an employee returns to the same results.
import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchOffIcon from '@mui/icons-material/SearchOff';

import EmployeeTable from '../components/EmployeeTable';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { EmptyState, ErrorState } from '../components/StatusViews';
import { useDeleteEmployee, useEmployeesQuery, useSearchEmployeesQuery } from '../hooks/useEmployees';
import { useDebounce } from '../hooks/useDebounce';
import { useNotify } from '../context/NotificationContext';
import { getErrorMessage } from '../utils/errors';
import { fullName } from '../utils/format';

const SEARCH_DELAY_MS = 400;

function EmployeeListPage() {
  const notify = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();

  // What is typed in the search fields right now (read from the URL).
  const department = searchParams.get('department') ?? '';
  const position = searchParams.get('position') ?? '';

  // The same values, but only once the user stops typing for 400 ms.
  const [debouncedDepartment, flushDepartment] = useDebounce(department, SEARCH_DELAY_MS);
  const [debouncedPosition, flushPosition] = useDebounce(position, SEARCH_DELAY_MS);

  // The search that is actually sent. Typed text waits for the debounce, but an emptied
  // field counts straight away, so "Clear" and removing a chip feel instant.
  const activeSearch = {
    department: department.trim() ? debouncedDepartment.trim() : '',
    position: position.trim() ? debouncedPosition.trim() : '',
  };
  const isSearching = Boolean(activeSearch.department || activeSearch.position);

  // Only one of these requests runs at a time: the full list, or the search.
  const listQuery = useEmployeesQuery({ enabled: !isSearching });
  const searchQuery = useSearchEmployeesQuery(activeSearch);
  const query = isSearching ? searchQuery : listQuery;
  const employees = query.data ?? [];

  const deleteMutation = useDeleteEmployee();
  // The employee waiting for delete confirmation (null = dialog closed).
  const [toDelete, setToDelete] = useState(null);

  // Writes the search into the URL. Empty terms are left out, so a cleared search is
  // just "/employees". replace: typing shouldn't add a Back-button step per letter.
  const updateSearch = (changes) => {
    const next = { department, position, ...changes };
    const params = {};
    if (next.department) params.department = next.department;
    if (next.position) params.position = next.position;
    setSearchParams(params, { replace: true });
  };

  const handleSearchNow = () => {
    flushDepartment();
    flushPosition();
  };

  const clearSearch = () => setSearchParams({}, { replace: true });

  const confirmDelete = () => {
    deleteMutation.mutate(toDelete, {
      onSuccess: () => notify(`${fullName(toDelete)} was deleted.`),
      onError: (err) => notify(getErrorMessage(err), 'error'),
      onSettled: () => setToDelete(null),
    });
  };

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/employees/add">
      Add Employee
    </Button>
  );

  let content;
  if (query.isPending) {
    content = <EmployeeTable loading />;
  } else if (query.isError) {
    content = <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  } else if (employees.length === 0 && isSearching) {
    content = (
      <EmptyState
        icon={<SearchOffIcon />}
        title="No matching employees"
        message="None of your employees match this search. Try different words, or clear the search."
        action={
          <Button variant="outlined" onClick={clearSearch}>
            Clear search
          </Button>
        }
      />
    );
  } else if (employees.length === 0) {
    content = (
      <EmptyState
        icon={<GroupAddIcon />}
        title="No employees yet"
        message="Add your first employee to see them listed here."
        action={addButton}
      />
    );
  } else {
    content = (
      <EmployeeTable
        employees={employees}
        onDelete={setToDelete}
        deletingId={deleteMutation.isPending ? toDelete?._id : null}
        caption={isSearching ? 'Search results' : 'Your employees'}
      />
    );
  }

  const countText = `${employees.length} ${employees.length === 1 ? 'employee' : 'employees'}`;
  const hasResults = !query.isPending && !query.isError;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography variant="h1">Employees</Typography>
          {!isSearching && hasResults && <Typography color="text.secondary">{countText}</Typography>}
        </Box>
        {addButton}
      </Box>

      <SearchBar
        department={department}
        position={position}
        onChange={(name, value) => updateSearch({ [name]: value })}
        onSubmit={handleSearchNow}
        onClear={clearSearch}
      />

      {isSearching && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {/* role="status": screen readers announce the new count after each search. */}
          <Typography role="status" sx={{ fontWeight: 600 }}>
            {hasResults ? `Search results: ${countText}` : 'Searching…'}
          </Typography>
          {activeSearch.department && (
            <Chip
              label={`Department: ${activeSearch.department}`}
              onDelete={() => updateSearch({ department: '' })}
              size="small"
            />
          )}
          {activeSearch.position && (
            <Chip
              label={`Position: ${activeSearch.position}`}
              onDelete={() => updateSearch({ position: '' })}
              size="small"
            />
          )}
        </Box>
      )}

      {/* A thin bar while a new search loads over the previous results. */}
      {query.isPlaceholderData && <LinearProgress sx={{ mb: 1 }} aria-label="Loading search results" />}

      {content}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete employee?"
        message={toDelete ? `Delete ${fullName(toDelete)}? This can't be undone.` : ''}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

export default EmployeeListPage;
