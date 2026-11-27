// TanStack Query hooks for employee data. Pages call these instead of Axios directly:
// the hooks give loading/error states and caching, and the query keys below decide
// which cached data is refreshed after a change.
//   ['employees']                    -> the full list
//   ['employees', 'search', params]  -> search results (Phase 9)
//   ['employee', id]                 -> one employee
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEmployee, deleteEmployee, getEmployee, listEmployees, updateEmployee } from '../api/employees.api';

export function useEmployeesQuery() {
  return useQuery({ queryKey: ['employees'], queryFn: listEmployees });
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
