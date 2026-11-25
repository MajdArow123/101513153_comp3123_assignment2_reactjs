// Shows a list of employees: a table on wide screens, stacked cards on narrow ones
// (a 7-column table doesn't fit on a phone). Used for the full list and for search results.
// With `loading` it shows skeleton placeholders in the same layout.
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardActions, CardContent, IconButton, Paper, Skeleton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import EmployeeAvatar from './EmployeeAvatar';
import { fullName } from '../utils/format';

const SKELETON_ROWS = 4;

// View / Edit / Delete icon buttons. aria-label includes the name, so a screen reader
// says "Delete Jane Doe" instead of just "Delete".
function RowActions({ employee, onDelete, disabled }) {
  const name = fullName(employee);
  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <Tooltip title="View">
        <IconButton component={RouterLink} to={`/employees/${employee._id}`} aria-label={`View ${name}`}>
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton component={RouterLink} to={`/employees/${employee._id}/edit`} aria-label={`Edit ${name}`} color="primary">
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        {/* span: a Tooltip needs an element that can receive hover even when the button is disabled */}
        <span>
          <IconButton onClick={() => onDelete(employee)} aria-label={`Delete ${name}`} color="error" disabled={disabled}>
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

function EmployeeCards({ employees, loading, onDelete, deletingId }) {
  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={112} />
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {employees.map((employee) => (
        <Card key={employee._id} component="li" variant="outlined">
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', pb: 0 }}>
            <EmployeeAvatar employee={employee} size={56} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>{fullName(employee)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.position} · {employee.department}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {employee.email}
              </Typography>
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end' }}>
            <RowActions employee={employee} onDelete={onDelete} disabled={deletingId === employee._id} />
          </CardActions>
        </Card>
      ))}
    </Stack>
  );
}

function EmployeeRowsTable({ employees, loading, onDelete, deletingId, caption }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label={caption}>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.50' } }}>
            <TableCell>Photo</TableCell>
            <TableCell>First name</TableCell>
            <TableCell>Last name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Department</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton variant="circular" width={40} height={40} />
                  </TableCell>
                  {Array.from({ length: 6 }, (__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : employees.map((employee) => (
                <TableRow key={employee._id} hover>
                  <TableCell>
                    <EmployeeAvatar employee={employee} />
                  </TableCell>
                  <TableCell>{employee.first_name}</TableCell>
                  <TableCell>{employee.last_name}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere' }}>{employee.email}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell align="right">
                    <RowActions employee={employee} onDelete={onDelete} disabled={deletingId === employee._id} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EmployeeTable({ employees = [], loading = false, onDelete, deletingId = null, caption = 'Employees' }) {
  const theme = useTheme();
  // Below the "md" breakpoint (900 px, so phones and portrait tablets) use cards.
  const useCards = useMediaQuery(theme.breakpoints.down('md'));

  return useCards ? (
    <EmployeeCards employees={employees} loading={loading} onDelete={onDelete} deletingId={deletingId} />
  ) : (
    <EmployeeRowsTable employees={employees} loading={loading} onDelete={onDelete} deletingId={deletingId} caption={caption} />
  );
}

export default EmployeeTable;
