// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { PlusIcon, CheckIcon, Trash2Icon, DollarSignIcon, XIcon, LogOut, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import './styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import DailyAttendance from "@/components/DailyAttendance";
import { supabaseHelpers, authHelpers } from './supabase-client.js';
import { getCurrentDateString } from './lib/utils';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  parent_email?: string;
  phone?: string;
  image?: string;
  location?: string;
  schedule: Record<string, boolean>;
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
      excused?: boolean;
    };
  };
  paymentStatus?: {
    [month: string]: "Funding" | "Not Funded";
  };
  createdAt?: string; // ISO date string when client was created
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    // Load from localStorage on component mount
    return localStorage.getItem('selectedLocation') || "All Locations";
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('employee'); // Default to employee for security
  const [userName, setUserName] = useState<string>('');

  // Load user role and clients from Supabase
  useEffect(() => {
    const loadUserAndClients = async () => {
      try {
        // First, get the current user and their role
        const user = await authHelpers.getCurrentUser();
        if (user) {
          const userData = await authHelpers.getUserRole(user.id);
          setUserRole(userData.role);
          setUserName(userData.name);
        }

        // Then load clients
        const clients = await supabaseHelpers.getClients();
        // Load attendance data for each client
        const clientsWithAttendance = await Promise.all(
          clients.map(async (client) => {
            try {
              return await supabaseHelpers.getClientWithAttendance(client.id);
            } catch (error) {
              console.error(`Error loading attendance for client ${client.id}:`, error);
              return client;
            }
          })
        );
        setClients(clientsWithAttendance);
        const uniqueLocations = ["All Locations", ...Array.from(new Set(clientsWithAttendance.map((c: Client) => c.location).filter(Boolean))) as string[]];
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error loading user or clients:', error);
        toast.error('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndClients();
  }, []);

  // Handle opening add client page
  const handleAddClientClick = () => {
    navigate('/add-client');
  };

  // Handle location filter change
  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    localStorage.setItem('selectedLocation', location);
  };

  // Handle client deletion (admin only)
  const handleDeleteClient = async (clientId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the client selection

    // Check if user is admin
    if (userRole !== 'admin') {
      toast.error('Only administrators can delete clients');
      return;
    }

    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await supabaseHelpers.deleteClient(clientId);

        // Remove client from state
        const updatedClients = clients.filter(client => client.id !== clientId);
        setClients(updatedClients);

        toast.success('Client deleted successfully');
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Error deleting client');
      }
    }
  };

  // Handle client selection (navigation only)
  const handleClientClick = (client: Client) => {
    navigate(`/client/${client.id}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      // Clear local storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  // Handle navigation to user management
  const handleUserManagementClick = () => {
    navigate('/user-management');
  };

  // Handle client check-in with Supabase
  const handleCheckIn = async (client: Client, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click from navigating

    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dateStr = getCurrentDateString();

    if (client.schedule[dayName as keyof typeof client.schedule]) {
      try {
        const currentRecord = client.attendance?.[dateStr];
        const alreadyCheckedIn = currentRecord?.attended;
        
        if (!alreadyCheckedIn) {
          // Check in: 2 hours
          await supabaseHelpers.updateAttendance(client.id, dateStr, {
            status: 'present',
            hours: 2,
            excused: false
          });
          toast.success(`${client.name} has been checked in for today.`);
        } else {
          // Undo check-in - remove the attendance record entirely
          await supabaseHelpers.updateAttendance(client.id, dateStr, {
            status: 'unexcused',
            hours: 0,
            excused: false
          });
          toast.info(`${client.name}'s check-in for today has been undone.`);
        }

        // Reload all clients to get updated data
        const updatedClients = await Promise.all(
          clients.map(async (c) => {
            try {
              return await supabaseHelpers.getClientWithAttendance(c.id);
            } catch (error) {
              console.error(`Error reloading client ${c.id}:`, error);
              return c;
            }
          })
        );
        setClients(updatedClients);
      } catch (error) {
        console.error('Error updating attendance:', error);
        toast.error('Error updating attendance');
      }
    } else {
      toast.info(`${client.name} is not scheduled for today.`);
    }
  };

  const getPaymentStatus = (client: Client) => {
    const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return client.paymentStatus?.[month] || "Not Funded";
  };

  // Get attendance state for today to determine card styling
  const getAttendanceState = (client: Client) => {
    const todayDateStr = getCurrentDateString();
    const attendanceRecord = client.attendance?.[todayDateStr];
    
    if (!attendanceRecord) {
      return null; // No attendance record
    }
    
    if (attendanceRecord.attended) {
      if (attendanceRecord.hours === 2) {
        return 'attended-2h';
      } else if (attendanceRecord.hours === 3) {
        return 'attended-3h';
      } else {
        return 'checked-in'; // Fallback for other attended states
      }
    } else if (attendanceRecord.excused) {
      return 'excused-absent';
    } else {
      return 'unexcused-absent';
    }
  };

  const today = new Date();
  const todayDayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const todayDateStr = getCurrentDateString();

  const sortedAndFilteredClients = clients
    .filter(client => selectedLocation === "All Locations" || client.location === selectedLocation)
    .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aScheduledToday = a.schedule[todayDayName as keyof typeof a.schedule];
      const bScheduledToday = b.schedule[todayDayName as keyof typeof b.schedule];
      const aCheckedIn = a.attendance && a.attendance[todayDateStr]?.attended;
      const bCheckedIn = b.attendance && b.attendance[todayDateStr]?.attended;

      // First priority: Scheduled but not checked in
      if (aScheduledToday && !aCheckedIn && !(bScheduledToday && !bCheckedIn)) return -1;
      if (bScheduledToday && !bCheckedIn && !(aScheduledToday && !aCheckedIn)) return 1;

      // Second priority: Scheduled and checked in
      if (aScheduledToday && aCheckedIn && !(bScheduledToday && bCheckedIn)) return -1;
      if (bScheduledToday && bCheckedIn && !(aScheduledToday && aCheckedIn)) return 1;

      // Third priority: Unscheduled
      if (aScheduledToday && !bScheduledToday) return -1;
      if (bScheduledToday && !aScheduledToday) return 1;

      // Finally, sort alphabetically
      return a.name.localeCompare(b.name);
    });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Toaster />

      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">Unified ESL Client Management Dashboard</h1>
            <p className="dashboard-subtitle">Manage your clients and view their attendance</p>
            <p className="user-info">Welcome, {userName} ({userRole})</p>
          </div>
          <div className="header-actions">
            {userRole === 'admin' && (
              <button
                onClick={handleUserManagementClick}
                className="user-management-button"
                title="Manage Users"
              >
                <Users className="h-4 w-4" />
                Manage Users
              </button>
            )}
            <button
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-top-row">
        <div className="daily-attendance-compact">
          <DailyAttendance clients={clients} />
        </div>
        <div className="dashboard-filters-inline">
          <select
            className="select location-select"
            value={selectedLocation}
            onChange={e => handleLocationChange(e.target.value)}
          >
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <Input
            type="text"
            placeholder="Search clients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="clients-grid">
        {sortedAndFilteredClients.map(client => {
          const attendanceState = getAttendanceState(client);
          return (
          <Card
            key={client.id}
            className={`client-card ${attendanceState ? attendanceState : ''}`}
            onClick={() => handleClientClick(client)}
          >
            <CardContent className="client-card-content">
              <div className="client-info">
                <Avatar className="client-avatar">
                  <AvatarImage src={client.image} alt={client.name} />
                  <AvatarFallback>{client.initials}</AvatarFallback>
                </Avatar>
                <div className="client-details">
                  <h3 className="client-name">{client.name}</h3>
                  {client.parent_email && <p className="client-email">{client.parent_email}</p>}

                  <span className={`payment-status ${getPaymentStatus(client).toLowerCase()}`}>
                    {getPaymentStatus(client) === "Funding" && (
                      <span className="paid-icon-wrapper" title="Funding">
                        <DollarSignIcon className="paid-icon" />
                      </span>
                    )}
                    {getPaymentStatus(client)}
                  </span>
                </div>
              </div>
              {userRole === 'admin' && (
                <button
                  className="client-delete-btn"
                  onClick={(e) => handleDeleteClient(client.id, e)}
                  title="Delete client"
                >
                  <Trash2Icon className="trash-icon" />
                </button>
              )}
              <button
                className={`check-in-button${!client.schedule[todayDayName]
                    ? ' check-in-faded' : client.attendance && client.attendance[todayDateStr]?.attended
                      ? ' checked-in' : ''
                  }`}
                onClick={(e) => handleCheckIn(client, e)}
                title={client.attendance && client.attendance[todayDateStr]?.attended ? "Undo check-in" : "Check in client"}
                disabled={!client.schedule[todayDayName]}
              >
                {client.attendance && client.attendance[todayDateStr]?.attended ? <XIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
              </button>
            </CardContent>
          </Card>
          );
        })}

        <Card
          className="add-client-card"
          onClick={handleAddClientClick}
        >
          <CardContent className="add-client-content">
            <PlusIcon className="h-8 w-8" />
            <span>Add New Client</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}