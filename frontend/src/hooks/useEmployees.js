// TanStack Query hooks for employee data. Pages call these instead of Axios directly:
// the hooks give loading/error states and caching, and the query keys below decide
// which cached data is refreshed after a change.
//   ['employees']                    -> the full list
//   ['employees', 'search', params]  -> search results
//   ['employee', id]                 -> one employee
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmployee, deleteEmployee, getEmployee, listEmployees, searchEmployees, updateEmployee,
} from '../api/employees.api';

// `enabled: false` while searching, so the full list isn't requested for nothing.
export function useEmployeesQuery({ enabled = true } = {}) {
  return useQuery({ queryKey: ['employees'], queryFn: listEmployees, enabled });
}

// params = { department, position } (already trimmed). The search runs on the backend,
// which only returns the logged-in user's employees.
export function useSearchEmployeesQuery(params) {
  const hasTerm = Boolean(params.department || params.position);
  return useQuery({
    queryKey: ['employees', 'search', params],
    queryFn: () => searchEmployees(params),
    enabled: hasTerm,
    // While the next search loads, keep showing the previous results instead of
    // flashing skeletons on every change.
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeQuery(id) {
  return useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id), enabled: Boolean(id) });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee) => deleteEmployee(employee._id),
    onSuccess: (data, employee) => {
      // ['employees'] also matches every ['employees', 'search', ...] key, so the list
      // and any search results are refetched without the deleted employee.
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.removeQueries({ queryKey: ['employee', employee._id] });
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => createEmployee(formData),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] }); // list + search results
      queryClient.setQueryData(['employee', employee._id], employee); // details page opens instantly
    },
  });
}

export function useUpdateEmployee(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => updateEmployee(id, formData),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.setQueryData(['employee', id], employee); // the server's updated version
    },
  });
}
