const API_BASE_URL = import.meta.env.PROD 
  ? 'https://crono-juventude-backend-production.up.railway.app/api'
  : 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const response = await this.request<{token: string, user: any}>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    localStorage.setItem('auth-token', response.token);
    return response;
  }

  logout() {
    localStorage.removeItem('auth-token');
  }

  // Employees
  async getEmployees() {
    return this.request<any[]>('/employees');
  }

  async getEmployeeById(id: string) {
    return this.request<any>(`/employees/${id}`);
  }

  async getScheduledEmployeesToday() {
    return this.request<any[]>('/employees/scheduled-today');
  }

  async createEmployee(employee: {
    name: string;
    position: string;
    registration: string;
    workDays: string[];
  }) {
    return this.request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  }

  async updateEmployee(id: string, employee: {
    name?: string;
    position?: string;
    registration?: string;
    workDays?: string[];
  }) {
    return this.request<any>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee)
    });
  }

  async deleteEmployee(id: string) {
    return this.request<void>(`/employees/${id}`, {
      method: 'DELETE'
    });
  }

  // Time Records
  async getTimeRecords(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return this.request<any[]>(`/time-records${query ? `?${query}` : ''}`);
  }

  async getTodayRecords() {
    return this.request<any[]>('/time-records/today');
  }

  async createTimeRecord(record: {
    employeeId: string;
    date: string;
    entryTime?: string;
    exitTime?: string;
  }) {
    return this.request<any>('/time-records', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }

  async clockInOut(employeeId: string) {
    return this.request<{
      message: string;
      record: any;
      action: 'entry' | 'exit';
    }>('/time-records/clock', {
      method: 'POST',
      body: JSON.stringify({ employeeId })
    });
  }

  async deleteTimeRecord(id: string) {
    return this.request<void>(`/time-records/${id}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{status: string, timestamp: string}>('/health');
  }

  // Relatório de frequência
  async getAttendanceReport(params: {
    startDate: string;
    endDate: string;
    employeeId?: string;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.employeeId) searchParams.append('employeeId', params.employeeId);
    
    return this.request<any[]>(`/time-records/attendance-report?${searchParams.toString()}`);
  }

  // Gerar registros de falta para uma data
  async generateAbsenceRecords(date: string) {
    return this.request<{message: string}>('/time-records/generate-absences', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  // Marcar falta manualmente
  async markAbsence(employeeId: string, date: string, status: string, observations?: string, shift?: string) {
    return this.request<any>('/time-records/mark-absence', {
      method: 'POST',
      body: JSON.stringify({ employeeId, date, status, observations, shift })
    });
  }
}

export const api = new ApiService();
