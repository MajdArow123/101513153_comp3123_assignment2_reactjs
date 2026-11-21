// Page layout (nav bar + content) and all the app's routes.
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';

import NavBar from './components/NavBar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmployeeListPage from './pages/EmployeeListPage';
import AddEmployeePage from './pages/AddEmployeePage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';
import EditEmployeePage from './pages/EditEmployeePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, flexGrow: 1 }}>
        {/* key: a new page gets a fresh boundary, so after an error the user can still navigate away. */}
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/employees" replace />} />

            {/* Only for logged-out users */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Only for logged-in users.
                React Router ranks a fixed path ("/employees/add") above a parameter
                ("/employees/:id"), so "add" is never treated as an employee id. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/add" element={<AddEmployeePage />} />
              <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
              <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </Container>
    </Box>
  );
}

export default App;
