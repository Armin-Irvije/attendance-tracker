// Supabase Client Configuration
// Replace with your actual Supabase URL and anon key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiewnzvnoddqemgipqlz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXduenZub2RkcWVtZ2lwcWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODY2NDMsImV4cCI6MjA2OTU2MjY0M30.unLVod5zz186sJRPMDyMenezyIvKrbmTuRNM3LvtxvY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
export const authHelpers = {
  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    
    // If signup was successful and we have user data, insert into users table
    if (data.user && userData.name && userData.role) {
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: email,
            name: userData.name,
            role: userData.role
          }]);
        
        if (insertError) {
          console.error('Error inserting user into users table:', insertError);
          // Don't throw here as the auth user was created successfully
        }
      } catch (err) {
        console.error('Error in signup process:', err);
        // Don't throw here as the auth user was created successfully
      }
    }
    
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user role from users table
  async getUserRole(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting user role:', error);
      // Return default values if user not found in users table
      return { role: 'employee', name: 'Unknown User' };
    }
    
    // If no user found, return default values
    if (!data) {
      console.warn('User not found in users table, using default role');
      return { role: 'employee', name: 'Unknown User' };
    }
    
    return data;
  },

  // Check if user is authenticated and get their role
  async getAuthUserWithRole() {
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    const userData = await this.getUserRole(user.id);
    return {
      ...user,
      role: userData.role,
      name: userData.name
    };
  },

  // Helper function to create admin user manually
  async createAdminUser(email, password, name) {
    try {
      // First create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'admin' }
        }
      });
      
      if (error) throw error;
      
      // Then insert into users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: email,
            name: name,
            role: 'admin'
          }]);
        
        if (insertError) {
          console.error('Error inserting admin user:', insertError);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  },

  // Helper function to check existing users
  async getUsersList() {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error getting users list:', error);
      return [];
    }
    
    return data || [];
  }
};

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
    
    console.log('updateAttendance called with:', { clientId, date, attendanceData });
    
    // Ensure the status is properly set based on the data
    let finalStatus = status;
    let finalHours = hours || 0;
    let finalExcused = excused || false;
    
    if (status === 'present' && hours > 0) {
      finalStatus = 'present';
      finalHours = hours;
      finalExcused = false;
    } else if (status === 'excused') {
      finalStatus = 'excused';
      finalHours = 0;
      finalExcused = true;
    } else if (status === 'unexcused' || status === 'absent') {
      finalStatus = 'unexcused';
      finalHours = 0;
      finalExcused = false;
    } else {
      finalStatus = 'unexcused';
      finalHours = 0;
      finalExcused = false;
    }
    
    console.log('Final attendance data to save:', { finalStatus, finalHours, finalExcused });
    
    // Try to delete existing record first, then insert new one
    try {
      // First, delete any existing record for this client and date
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('client_id', clientId)
        .eq('date', date);
      
      if (deleteError) {
        console.error('Error deleting existing attendance:', deleteError);
        // Continue anyway, the record might not exist
      }
      
      // Now insert the new record
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          client_id: clientId,
          date: date,
          status: finalStatus,
          hours: finalHours,
          excused: finalExcused
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting attendance:', error);
        throw error;
      }
      
      console.log('Attendance saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in updateAttendance:', error);
      throw error;
    }
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
    
    console.log('Raw attendance data:', attendanceData);
    
    // Convert attendance data to the format expected by the UI
    const attendanceMap = {};
    attendanceData.forEach((record) => {
      attendanceMap[record.date] = {
        attended: record.status === 'present',
        hours: record.hours || 0,
        excused: record.status === 'excused'
      };
    });
    
    console.log('Converted attendance map:', attendanceMap);
    
    // Also convert payment_status from JSONB to the format expected by UI
    const paymentStatus = client.payment_status || {};
    
    return {
      ...client,
      attendance: attendanceMap,
      paymentStatus: paymentStatus
    };
  },

  // Clear attendance for a specific date (for testing)
  async clearAttendance(clientId, date) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('client_id', clientId)
      .eq('date', date);
    
    if (error) {
      console.error('Error clearing attendance:', error);
      throw error;
    }
    
    console.log('Attendance cleared for:', { clientId, date });
  }
}; 