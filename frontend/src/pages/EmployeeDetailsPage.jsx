// One employee's full details, with Edit / Delete / Back.
// The id comes from the URL (/employees/:id). The backend checks ownership, so typing
// another user's id here just shows "not found".
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Divider, Link, Paper, Skeleton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import EmployeeAvatar from '../components/EmployeeAvatar';
import ConfirmDialog from '../components/ConfirmDialog';
import EmployeeNotFound from '../components/EmployeeNotFound';
import { ErrorState } from '../components/StatusViews';
import { useDeleteEmployee, useEmployeeQuery } from '../hooks/useEmployees';
import { useNotify } from '../context/NotificationContext';
import { getErrorMessage, isNotAccessibleError } from '../utils/errors';
import { formatDate, formatDateTime, formatSalary, fullName } from '../utils/format';

// One "label: value" line in the details list.
function DetailRow({ label, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: { xs: 0, sm: 2 }, py: 1.25 }}>
      <Typography component="dt" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Box>
  );
}

function DetailsSkeleton() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }} aria-busy="true" aria-label="Loading employee">
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Skeleton variant="circular" width={140} height={140} />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Skeleton width="60%" height={40} />
          <Skeleton width="40%" />
        </Box>
      </Box>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} height={36} />
      ))}
    </Paper>
  );
}

function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const { data: employee, isPending, isError, error, refetch } = useEmployeeQuery(id);
  const deleteMutation = useDeleteEmployee();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const backButton = (
    <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/employees">
      Back to employees
    </Button>
  );

  if (isPending) return <DetailsSkeleton />;

  if (isError) {
    if (isNotAccessibleError(error)) return <EmployeeNotFound />;
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} action={backButton} />;
  }

  const name = fullName(employee);

  const confirmDelete = () => {
    deleteMutation.mutate(employee, {
      onSuccess: () => {
        notify(`${name} was deleted.`);
        // replace: the deleted employee's page shouldn't be reachable with Back.
        navigate('/employees', { replace: true });
      },
      onError: (err) => {
        setConfirmOpen(false);
        notify(getErrorMessage(err), 'error');
      },
    });
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>{backButton}</Box>

      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <EmployeeAvatar employee={employee} size={140} sx={{ border: 4, borderColor: 'grey.100' }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h1">{name}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              {employee.position} · {employee.department}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* A description list (dl/dt/dd): the semantic HTML for label-value pairs. */}
        <Box component="dl" sx={{ m: 0 }}>
          <DetailRow label="First name">{employee.first_name}</DetailRow>
          <DetailRow label="Last name">{employee.last_name}</DetailRow>
          <DetailRow label="Email">
            <Link href={`mailto:${employee.email}`}>{employee.email}</Link>
          </DetailRow>
          <DetailRow label="Position">{employee.position}</DetailRow>
          <DetailRow label="Department">{employee.department}</DetailRow>
          <DetailRow label="Salary">{formatSalary(employee.salary)}</DetailRow>
          <DetailRow label="Date of joining">{formatDate(employee.date_of_joining)}</DetailRow>
          <DetailRow label="Created">{formatDateTime(employee.created_at)}</DetailRow>
          <DetailRow label="Last updated">{formatDateTime(employee.updated_at)}</DetailRow>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={RouterLink}
            to={`/employees/${employee._id}/edit`}
            disabled={deleteMutation.isPending}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete employee?"
        message={`Delete ${name}? This can't be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export default EmployeeDetailsPage;
