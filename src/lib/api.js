export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export function requestOrigin() {
  // Keep loopback previews same-site for the HttpOnly admin cookie.
  if (typeof window === 'undefined') return API_BASE_URL;
  const configured = new URL(API_BASE_URL);
  const loopback = ['localhost', '127.0.0.1'];
  if (loopback.includes(configured.hostname) && loopback.includes(window.location.hostname)) {
    configured.hostname = window.location.hostname;
  }
  return configured.toString().replace(/\/+$/, '');
}

async function request(path, { method = 'GET', data, headers = {}, signal } = {}) {
  const response = await fetch(`${requestOrigin()}/api${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: data ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: data ? JSON.stringify(data) : undefined,
  }).catch(() => {
    throw new Error('Cannot reach the TechNeeds API. Start the local backend and try again.');
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.code = result?.code;
    throw error;
  }
  if (typeof window !== 'undefined' && ['POST','DELETE'].includes(method) && /\/(session(?:\/migrate)?|login|change-password)$/.test(path)) window.dispatchEvent(new Event('techneeds-session-changed'));
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

export function adminRequest(path, options = {}) {
  return request(`/admin${path}`, options);
}

export function acceptMentorInvite(token, password) {
  return request('/onboard', { method: 'POST', data: { token, password } });
}

export function mentorRequest(path, options = {}) {
  return request(`/mentor${path}`, options);
}
export function menteeRequest(path, token, options = {}) {
  return request(`/m${path}`, { ...options, headers: { ...options.headers, ...(token ? { 'x-auth-token': token } : {}) } });
}

export function resetDemo(){return request('/demo/reset',{method:'POST',data:{confirm:true}});}

export function getGuideStatus(){return request('/guide');}
export function askGuide(messages,page,signal){
  const prefix=/^\/admin(?:\/|$)/.test(page)?'/admin':/^\/mentor(?:\/|$)/.test(page)?'/mentor':/^\/mentee(?:\/|$)/.test(page)||page==='/dashboard'||page==='/change-password'?'/m':'';
  return request(`${prefix}/guide`,{method:'POST',data:{messages,page},signal});
}
