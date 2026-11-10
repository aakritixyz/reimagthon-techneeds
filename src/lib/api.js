export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function request(path, { method = 'GET', data, headers = {} } = {}) {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers: data ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: data ? JSON.stringify(data) : undefined,
  }).catch(() => {
    throw new Error('Cannot reach the TechNeeds API. Start the local backend and try again.');
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
}

export function createProgram(name, adminKey) {
  return request('/programs', { method: 'POST', data: { name }, headers: { 'x-admin-key': adminKey } });
}

export function createMentor(data, adminKey) {
  return request('/mentors', { method: 'POST', data, headers: { 'x-admin-key': adminKey } });
}

export function addMentorToProgram(programId, mentorId, adminKey) {
  return request(`/programs/${programId}/add-mentor`, {
    method: 'POST',
    data: { mentorId },
    headers: { 'x-admin-key': adminKey },
  });
}

export function getAllPrograms(adminKey) {
  return request('/programs', { headers: { 'x-admin-key': adminKey } });
}

export function getAllMentors(adminKey) {
  return request('/mentors', { headers: { 'x-admin-key': adminKey } });
}

export function mentorLogin(email, password) {
  return request('/mentors/login', { method: 'POST', data: { email, password } });
}

export function addMentee(token, data) {
  return request('/mentees', { method: 'POST', data, headers: { 'x-auth-token': token } });
}

export function addResource(token, data, isQuiz = false) {
  return request(isQuiz ? '/resources/quiz' : '/resources', {
    method: 'POST', data, headers: { 'x-auth-token': token },
  });
}

export function getMentorDetails(token) {
  return request('/mentors/me', { headers: { 'x-auth-token': token } });
}

export function getProgramMentees(programId, token) {
  return request(`/${programId}/mentees`, { headers: { 'x-auth-token': token } });
}

export function getProgramResources(programId, token) {
  return request(`/${programId}/resources`, { headers: { 'x-auth-token': token } });
}
