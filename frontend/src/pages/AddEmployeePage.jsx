// "Add Employee": an empty EmployeeForm that creates a new employee (POST, multipart).
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';

import EmployeeForm from '../components/EmployeeForm';
import { useCreateEmployee } from '../hooks/useEmployees';
import { useNotify } from '../context/NotificationContext';
import { fullName } from '../utils/format';

function AddEmployeePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const createMutation = useCreateEmployee();

  const handleSubmit = async (formData) => {
    // mutateAsync throws on failure, so EmployeeForm can show the backend's errors.
    const employee = await createMutation.mutateAsync(formData);
    notify(`${fullName(employee)} was added.`);
    navigate(`/employees/${employee._id}`, { replace: true });
  };

  // Go back where the user came from; if they opened this page directly
  // (no earlier page in this tab), go to the list instead.
  const handleCancel = () => (location.key !== 'default' ? navigate(-1) : navigate('/employees'));

  return (
    <>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Add Employee
      </Typography>
      <EmployeeForm submitLabel="Save employee" onSubmit={handleSubmit} onCancel={handleCancel} />
    </>
  );
}

export default AddEmployeePage;
