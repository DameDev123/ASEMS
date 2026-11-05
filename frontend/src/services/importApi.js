import { apiRequest } from './api.js';

// Client for /api/imports (administrator only). Matches backend/src/routes/imports.routes.js.
const post = (path, body) =>
  apiRequest(path, { method: 'POST', body: JSON.stringify(body) }).then((result) => result?.data);

export const importStudentsRequest = (body) => post('/imports/students', body);
export const importInstructorsRequest = (body) => post('/imports/instructors', body);