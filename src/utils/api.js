const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : '');

export const getBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch backend health:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Login failed');
  }
  return await response.json();
};

export const registerEmployee = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return await response.json();
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to send OTP');
  }
  return await response.json();
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Password reset failed');
  }
  return await response.json();
};

// 1. GET /api/hackathons
export const getHackathons = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch hackathons:', error);
    throw error;
  }
};

// 2. GET /api/hackathons/{id}
export const getHackathon = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch hackathon ${id}:`, error);
    throw error;
  }
};

export const getHackathonById = getHackathon;

// GET /api/hackathons/by-department/{departmentId}
export const getHackathonsByDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons/by-department/${departmentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch hackathons for department ${departmentId}:`, error);
    throw error;
  }
};


// 3. POST /api/hackathons
export const createHackathon = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create hackathon:', error);
    throw error;
  }
};

// 4. PUT /api/hackathons/{id}
export const updateHackathon = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update hackathon ${id}:`, error);
    throw error;
  }
};

// 5. DELETE /api/hackathons/{id}
export const deleteHackathon = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hackathons/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete hackathon ${id}:`, error);
    throw error;
  }
};

// ==================== DEPARTMENT API ====================
export const getDepartments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/departments`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    throw error;
  }
};

// ==================== EMPLOYEE API ====================
export const getEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error;
  }
};

export const createEmployee = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update employee ${id}:`, error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete employee ${id}:`, error);
    throw error;
  }
};

// ==================== LEARNING RESOURCES API ====================
export const getResources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    throw error;
  }
};

export const getResourcesByDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/by-department/${departmentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch resources for department ${departmentId}:`, error);
    throw error;
  }
};

export const getSources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sources`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return [];
  }
};

export const syncSource = async (sourceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/sources/${sourceId}/sync`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to sync source ${sourceId}:`, error);
    throw error;
  }
};

export const syncResources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/sync`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to sync resources:', error);
    throw error;
  }
};

export const createResource = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
};

export const updateResource = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update resource ${id}:`, error);
    throw error;
  }
};

export const deleteResource = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete resource ${id}:`, error);
    throw error;
  }
};



// ==================== CODING PRACTICE API ====================
export const getCodingProblems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch coding problems:', error);
    throw error;
  }
};

export const getCodingProblemsByDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice/by-department/${departmentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch coding problems for department ${departmentId}:`, error);
    throw error;
  }
};

export const syncCodingPractice = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice/sync`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to sync coding practice:', error);
    throw error;
  }
};

export const createCodingProblem = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create coding problem:', error);
    throw error;
  }
};

export const updateCodingProblem = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update coding problem ${id}:`, error);
    throw error;
  }
};

export const deleteCodingProblem = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding-practice/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete coding problem ${id}:`, error);
    throw error;
  }
};

// ==================== AUTHENTICATION API ====================

export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    localStorage.removeItem('authToken');
    return null;
  }
  return await response.json();
};

export const logoutUser = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
  } catch (e) {}
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

export const toggleEmployeeStatus = async (id, isActive) => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update employee status');
  }
  return await response.json();
};

// ==================== WEEKLY CODING ASSIGNMENTS API ====================
export const generateWeeklyCodingAssignment = async () => {
  const response = await fetch(`${API_BASE_URL}/api/coding/weekly-generate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const getWeeklyCodingCurrent = async (employeeId = null) => {
  const url = employeeId 
    ? `${API_BASE_URL}/api/coding/weekly/current?employeeId=${encodeURIComponent(employeeId)}`
    : `${API_BASE_URL}/api/coding/weekly/current`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const completeEmployeeCodingProblem = async (employeeId, problemId) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/employee/${encodeURIComponent(employeeId)}/problem/${problemId}/complete`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// ==================== OPPORTUNITIES & WEBINARS API ====================
export const getOpportunities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);
    throw error;
  }
};

export const getUpcomingOpportunities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities/upcoming`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch upcoming opportunities:', error);
    throw error;
  }
};

export const getOpportunitiesByDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities/by-department/${departmentId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch opportunities for department ${departmentId}:`, error);
    throw error;
  }
};

export const syncOpportunities = async (sourceCode = 'ALL') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunity-sources/${sourceCode}/sync`, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to sync opportunities for ${sourceCode}:`, error);
    throw error;
  }
};

export const createOpportunity = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    throw error;
  }
};

export const updateOpportunity = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to update opportunity ${id}:`, error);
    throw error;
  }
};

export const deleteOpportunity = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete opportunity ${id}:`, error);
    throw error;
  }
};

export const syncLeetCodeCoding = async () => {
  const response = await fetch(`${API_BASE_URL}/api/coding/sync/leetcode`, { method: 'POST' });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const syncHackerRankCoding = async () => {
  const response = await fetch(`${API_BASE_URL}/api/coding/sync/hackerrank`, { method: 'POST' });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getWeeklyCodingChallenge = async (employeeId = null) => {
  try {
    const url = employeeId ? `${API_BASE_URL}/api/coding/weekly?employee_id=${employeeId}` : `${API_BASE_URL}/api/coding/weekly`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch weekly coding challenge:', error);
    throw error;
  }
};

export const generateWeeklyCodingChallenge = async (force = false) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/weekly/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const assignWeeklyCodingChallenge = async (challengeId, targetType = 'ALL', targetId = null) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/weekly/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, targetType, targetId }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getAdminCodingProgress = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding/admin/progress`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin coding progress:', error);
    throw error;
  }
};

export const getAdminEmployeeCodingDetails = async (employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding/admin/employee/${employeeId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch employee ${employeeId} coding details:`, error);
    throw error;
  }
};

export const startCodingProblem = async (problemId, employeeId = 'EMP001', challengeId = null) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/assignments/${problemId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, challengeId }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const submitCodingSolution = async (problemId, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/assignments/${problemId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getCodingSubmissionDetails = async (submissionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coding/submissions/${submissionId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch submission ${submissionId} details:`, error);
    throw error;
  }
};

export const verifyCodingSubmission = async (submissionId) => {
  const response = await fetch(`${API_BASE_URL}/api/coding/submissions/${submissionId}/verify`, { method: 'POST' });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const rejectCodingSubmission = async (submissionId, reviewComment = '') => {
  const response = await fetch(`${API_BASE_URL}/api/coding/submissions/${submissionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewComment }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getCurrentEmployeeId = () => {
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.employeeId) return String(user.employeeId);
      if (user.id) return String(user.id);
      if (user.email) return user.email;
    }
  } catch (e) {}
  return '252';
};

export const getEmployeePerformanceProgress = async (employeeId) => {
  const targetId = employeeId || getCurrentEmployeeId();
  try {
    const response = await fetch(`${API_BASE_URL}/api/employee/progress/${targetId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch employee ${targetId} performance progress:`, error);
    throw error;
  }
};

// ==================== HACKATHON REGISTRATION PROOF & ADMIN MONITORING ====================

export const registerHackathonWithProof = async (hackathonId, payload) => {
  const finalPayload = {
    ...payload,
    employeeId: payload.employeeId || getCurrentEmployeeId()
  };
  const response = await fetch(`${API_BASE_URL}/api/employee/hackathons/${hackathonId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalPayload),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getEmployeeHackathonRegistrations = async (employeeId) => {
  const targetId = employeeId || getCurrentEmployeeId();
  try {
    const response = await fetch(`${API_BASE_URL}/api/employee/hackathons/registrations/${targetId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch hackathon registrations for ${targetId}:`, error);
    return [];
  }
};

export const getAdminHackathonRegistrations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/hackathons/registrations`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin hackathon registrations:', error);
    return [];
  }
};

export const verifyHackathonRegistration = async (registrationId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/hackathons/registrations/${registrationId}/verify`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// ==================== SMART LEARNING RESOURCES & GENERATOR APIS ====================

export const getRecommendedResources = async (employeeId) => {
  const targetId = employeeId || getCurrentEmployeeId();
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/recommended/${targetId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch recommended resources for ${targetId}:`, error);
    return [];
  }
};

export const getHackathonResources = async (hackathonId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/hackathon/${hackathonId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch hackathon resources for ${hackathonId}:`, error);
    return [];
  }
};

export const generateResourcesApi = async (payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/resources/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getResourceStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/stats`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch resource stats:', error);
    return null;
  }
};

export const trackResourceProgressApi = async (payload) => {
  try {
    const finalPayload = {
      ...payload,
      employeeId: payload.employeeId || getCurrentEmployeeId()
    };
    const response = await fetch(`${API_BASE_URL}/api/resources/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to track resource progress:', error);
    return null;
  }
};

export const rejectHackathonRegistration = async (registrationId, reviewComment = '') => {
  const response = await fetch(`${API_BASE_URL}/api/admin/hackathons/registrations/${registrationId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewComment }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getAdminDashboardMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/metrics`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin dashboard metrics:', error);
    return null;
  }
};

// ==================== COMMUNICATION PRACTICE API ====================
export const getAdminCommunicationDashboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/communication/dashboard`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin communication dashboard:', error);
    throw error;
  }
};

export const getCommunicationAssignments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/communication/assignments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch communication assignments:', error);
    throw error;
  }
};

export const createCommunicationAssignment = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/communication/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const resData = await response.json();
  if (!response.ok) throw new Error(resData.detail || 'Failed to create assignment');
  return resData;
};

export const togglePublishAssignment = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/communication/assignments/${id}/publish`, { method: 'POST' });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const getEmployeeTodayAssignment = async (employeeId) => {
  try {
    const url = employeeId ? `${API_BASE_URL}/api/employee/communication/today?employee_id=${employeeId}` : `${API_BASE_URL}/api/employee/communication/today`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch employee today assignment:', error);
    throw error;
  }
};

export const submitCommunicationStory = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/communication/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Submission failed');
  }
  return await response.json();
};

export const getSubmissionResult = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/communication/submissions/${id}/result`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch submission result ${id}:`, error);
    throw error;
  }
};

export const getEmployeeCommunicationProgress = async (employeeId) => {
  try {
    const url = employeeId ? `${API_BASE_URL}/api/employee/communication/progress?employee_id=${employeeId}` : `${API_BASE_URL}/api/employee/communication/progress`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch employee communication progress:', error);
    throw error;
  }
};

export const syncAllSources = async () => {
  const sources = ['UNSTOP', 'DEVPOST', 'HACKEREARTH', 'DEVTO'];
  const results = [];
  for (const src of sources) {
    try {
      const res = await syncSource(src);
      results.push(res);
    } catch (e) {
      console.warn(`Sync source ${src} warning:`, e);
    }
  }
  return results;
};





