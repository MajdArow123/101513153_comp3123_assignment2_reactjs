// Calls to /api/v1/emp. Each function returns the "data" part of the backend response.
// The JWT is added by the Axios interceptor, so the backend knows who is asking and
// only ever returns that user's employees.
import axiosClient from './axiosClient';

export async function listEmployees() {
  const response = await axiosClient.get('/emp/employees');
  return response.data.data;
}

export async function getEmployee(id) {
  // encodeURIComponent: an id typed into the URL bar can't change the request path.
  const response = await axiosClient.get(`/emp/employees/${encodeURIComponent(id)}`);
  return response.data.data;
}

// formData is a FormData object (text fields + optional "profile_picture" file).
// We don't set Content-Type: the browser adds "multipart/form-data; boundary=..." itself.
export async function createEmployee(formData) {
  const response = await axiosClient.post('/emp/employees', formData);
  return response.data.data;
}

export async function updateEmployee(id, formData) {
  const response = await axiosClient.put(`/emp/employees/${encodeURIComponent(id)}`, formData);
  return response.data.data;
}

// The backend takes the id from the query string: DELETE /emp/employees?eid=...
// (204 No Content, so there is nothing to return.)
export async function deleteEmployee(eid) {
  await axiosClient.delete('/emp/employees', { params: { eid } });
}

// Only non-empty terms are sent, because the backend rejects empty searches.
export async function searchEmployees({ department, position }) {
  const params = {};
  if (department?.trim()) params.department = department.trim();
  if (position?.trim()) params.position = position.trim();

  const response = await axiosClient.get('/emp/employees/search', { params });
  return response.data.data;
}
