// The employee list (the first screen after login). The backend only returns the
// logged-in user's employees, so nobody else's data can ever appear here.
// (Search is added to this page in Phase 9.)
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

import EmployeeTable from '../components/EmployeeTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../components/StatusViews';
import { useDeleteEmployee, useEmployeesQuery } from '../hooks/useEmployees';
import { useNotify } from '../context/NotificationContext';
import { getErrorMessage } from '../utils/errors';
import { fullName } from '../utils/format';

function EmployeeListPage() {
  const notify = useNotify();
  const { data: employees = [], isPending, isError, error, refetch } = useEmployeesQuery();
  const deleteMutation = useDeleteEmployee();

  // The employee waiting for delete confirmation (null = dialog closed).
  const [toDelete, setToDelete] = useState(null);

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
  if (isPending) {
    content = <EmployeeTable loading />;
  } else if (isError) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
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
        caption="Your employees"
      />
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography variant="h1">Employees</Typography>
          {!isPending && !isError && (
            <Typography color="text.secondary">
              {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
            </Typography>
          )}
        </Box>
        {addButton}
      </Box>

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
