import client from './client';

export const authApi = {
  register: (payload) => client.post('auth/register/', payload),
  login: (payload) => client.post('auth/login/', payload),
  logout: (refresh) => client.post('auth/logout/', { refresh }),
  me: () => client.get('auth/me/'),
};

export const dashboardApi = {
  stats: () => client.get('dashboard/stats/'),
};

export const createCrudApi = (basePath) => ({
  list: () => client.get(`${basePath}/`),
  create: (payload, isMultipart = false) =>
    client.post(`${basePath}/`, payload, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  update: (id, payload, isMultipart = false) =>
    client.put(`${basePath}/${id}/`, payload, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  remove: (id) => client.delete(`${basePath}/${id}/`),
});

export const patientApi = createCrudApi('patients');
export const doctorApi = createCrudApi('doctors');
export const appointmentApi = {
  ...createCrudApi('appointments'),
  approve: (id) => client.post(`appointments/${id}/approve/`),
  reject: (id) => client.post(`appointments/${id}/reject/`),
  cancel: (id) => client.post(`appointments/${id}/cancel/`),
  complete: (id) => client.post(`appointments/${id}/complete/`),
  patientDetail: (id) => client.get(`appointments/${id}/patient-detail/`),
};
export const labApi = createCrudApi('lab-tests');
export const wardApi = createCrudApi('wards');
export const bedApi = createCrudApi('beds');
export const bedTransferApi = createCrudApi('bed-transfers');
