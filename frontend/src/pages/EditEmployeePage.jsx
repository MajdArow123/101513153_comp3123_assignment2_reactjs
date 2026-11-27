// "Edit Employee": loads the employee, then shows EmployeeForm pre-filled (PUT, multipart).
// Another user's id (403), an unknown id (404) or an invalid id (400) shows "not found".
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Paper, Skeleton, Typography } from '@mui/material';

import EmployeeForm from '../components/EmployeeForm';
import EmployeeNotFound from '../components/EmployeeNotFound';
import { ErrorState } from '../components/StatusViews';
import { useEmployeeQuery, useUpdateEmployee } from '../hooks/useEmployees';
import { useNotify } from '../context/NotificationContext';
import { getErrorMessage, isNotAccessibleError } from '../utils/errors';
import { getImageUrl } from '../utils/imageUrl';
import { fullName } from '../utils/format';

// Turns the employee from the API into the form's text values.
function toFormValues(employee) {
  return {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    position: employee.position,
    department: employee.department,
    salary: String(employee.salary),
    // The API sends "2024-01-15T00:00:00.000Z"; <input type="date"> needs "2024-01-15".
    date_of_joining: employee.date_of_joining ? employee.date_of_joining.slice(0, 10) : '',
  };
}

function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const { data: employee, isPending, isError, error, refetch } = useEmployeeQuery(id);
  const updateMutation = useUpdateEmployee(id);

  if (isPending) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 4 } }} aria-busy="true" aria-label="Loading employee">
        <Skeleton variant="circular" width={112} height={112} />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height={64} />
        ))}
      </Paper>
    );
  }

  if (isError) {
    if (isNotAccessibleError(error)) return <EmployeeNotFound />;
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const handleSubmit = async (formData) => {
    const updated = await updateMutation.mutateAsync(formData);
    notify(`${fullName(updated)} was updated.`);
    navigate(`/employees/${updated._id}`, { replace: true });
  };

  // Back where the user came from, or to the details page if they opened this URL directly.
  const handleCancel = () => (location.key !== 'default' ? navigate(-1) : navigate(`/employees/${id}`));

  return (
    <>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Edit {fullName(employee)}
      </Typography>
      {/* key: if a different employee is opened, the form starts again with its values. */}
      <EmployeeForm
        key={employee._id}
        initialValues={toFormValues(employee)}
        currentPictureUrl={getImageUrl(employee.profile_picture)}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
}

export default EditEmployeePage;
