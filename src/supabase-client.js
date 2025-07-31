// Supabase Client Configuration
// Replace with your actual Supabase URL and anon key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiewnzvnoddqemgipqlz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXduenZub2RkcWVtZ2lwcWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODY2NDMsImV4cCI6MjA2OTU2MjY0M30.unLVod5zz186sJRPMDyMenezyIvKrbmTuRNM3LvtxvY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const supabaseHelpers = {
  // Get all clients
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get client by ID
  async getClient(id) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new client
  async createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update client
  async updateClient(id, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete client
  async deleteClient(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get attendance for a client
  async getClientAttendance(clientId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Update attendance with proper status handling
  async updateAttendance(clientId, date, attendanceData) {
    const { status, hours, excused } = attendanceData;
    
    // Ensure the status is properly set based on the data
    let finalStatus = status;
    if (status === 'present' && hours > 0) {
      finalStatus = 'present';
    } else if (excused) {
      finalStatus = 'excused';
    } else if (status === 'unexcused') {
      finalStatus = 'unexcused';
    } else {
      finalStatus = 'unexcused';
    }
    
    const { data, error } = await supabase
      .from('attendance')
      .upsert([{
        client_id: clientId,
        date: date,
        status: finalStatus,
        hours: hours || 0,
        excused: excused || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get monthly stats for a client
  async getMonthlyStats(clientId, month, year) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    return data;
  },

  // Update client payment status
  async updateClientPaymentStatus(clientId, month, status) {
    // First get the current payment_status
    const { data: currentClient, error: fetchError } = await supabase
      .from('clients')
      .select('payment_status')
      .eq('id', clientId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update the payment_status JSONB field
    const currentPaymentStatus = currentClient.payment_status || {};
    const updatedPaymentStatus = { ...currentPaymentStatus, [month]: status };
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        payment_status: updatedPaymentStatus
      })
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get client with attendance data
  async getClientWithAttendance(clientId) {
    const [client, attendanceData] = await Promise.all([
      this.getClient(clientId),
      this.getClientAttendance(clientId)
    ]);
    
    // Convert attendance data to the format expected by the UI
    const attendanceMap = {};
    attendanceData.forEach((record) => {
      attendanceMap[record.date] = {
        attended: record.status === 'present',
        hours: record.hours || 0,
        excused: record.status === 'excused'
      };
    });
    
    // Also convert payment_status from JSONB to the format expected by UI
    const paymentStatus = client.payment_status || {};
    
    return {
      ...client,
      attendance: attendanceMap,
      paymentStatus: paymentStatus
    };
  }
}; 