// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { PlusIcon, CheckIcon, Trash2Icon, DollarSignIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import './styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import DailyAttendance from "@/components/DailyAttendance";
import { supabaseHelpers } from './supabase-client.js';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  image?: string;
  location?: string;
  schedule: Record<string, boolean>;
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
    };
  };
  paymentStatus?: {
    [month: string]: "Funding" | "Not Funded";
  };
}



export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("All Locations");
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load clients from Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clients = await supabaseHelpers.getClients();
        setClients(clients);
        const uniqueLocations = ["All Locations", ...Array.from(new Set(clients.map((c: Client) => c.location).filter(Boolean))) as string[]];
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Error loading clients');
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  // Handle opening add client page
  const handleAddClientClick = () => {
    navigate('/add-client');
  };

  // Handle client deletion
  const handleDeleteClient = async (clientId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the client selection

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

  // Handle client check-in
  const handleCheckIn = (client: Client, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click from navigating

    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dateStr = today.toISOString().split('T')[0];

    if (client.schedule[dayName as keyof typeof client.schedule]) {
      const updatedClient = { ...client };
      if (!updatedClient.attendance) {
        updatedClient.attendance = {};
      }

      const alreadyCheckedIn = updatedClient.attendance[dateStr]?.attended;
      if (!alreadyCheckedIn) {
        updatedClient.attendance[dateStr] = { attended: true, hours: 2 };
        toast.success(`${client.name} has been checked in for today.`);
      } else {
        updatedClient.attendance[dateStr] = { attended: false, hours: 0 };
        toast.info(`${client.name}'s check-in for today has been undone.`);
      }

      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
      if (clientIndex !== -1) {
        savedClients[clientIndex] = updatedClient;
        localStorage.setItem('clients', JSON.stringify(savedClients));
        setClients(savedClients);
      }
    } else {
      toast.info(`${client.name} is not scheduled for today.`);
    }
  };

  const getPaymentStatus = (client: Client) => {
    const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return client.paymentStatus?.[month] || "Unpaid";
  };

  const today = new Date();
  const todayDayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const todayDateStr = today.toISOString().split('T')[0];

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
        <h1 className="dashboard-title">Client Management Dashboard</h1>
        <p className="dashboard-subtitle">Manage your clients and view their attendance</p>
      </header>

      <div className="dashboard-top-row">
        <div className="daily-attendance-compact">
          <DailyAttendance clients={clients} />
        </div>
        <div className="dashboard-filters-inline">
          <select
            className="select location-select"
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
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
        {sortedAndFilteredClients.map(client => (
          <Card
            key={client.id}
            className={`client-card ${client.attendance && client.attendance[todayDateStr]?.attended ? 'checked-in' : ''}`}
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
                  {client.email && <p className="client-email">{client.email}</p>}

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
              <button
                className="client-delete-btn"
                onClick={(e) => handleDeleteClient(client.id, e)}
                title="Delete client"
              >
                <Trash2Icon className="trash-icon" />
              </button>
              <button
                className={`check-in-button${
                  !client.schedule[todayDayName]
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
        ))}

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