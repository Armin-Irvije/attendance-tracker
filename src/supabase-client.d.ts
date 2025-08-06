declare module './supabase-client.js' {
  export const supabase: any;
  
  export const supabaseHelpers: {
    getClients(): Promise<any[]>;
    getClient(id: string): Promise<any>;
    createClient(clientData: any): Promise<any>;
    updateClient(id: string, updates: any): Promise<any>;
    deleteClient(id: string): Promise<void>;
    getClientAttendance(clientId: string): Promise<any[]>;
    updateAttendance(clientId: string, date: string, attendanceData: any): Promise<any>;
    getMonthlyStats(clientId: string, month: number, year: number): Promise<any[]>;
    updateClientPaymentStatus(clientId: string, month: string, status: string): Promise<any>;
    getClientWithAttendance(clientId: string): Promise<any>;
    clearAttendance(clientId: string, date: string): Promise<void>;
  };
}

export {}; 