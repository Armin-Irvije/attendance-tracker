// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import './styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

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
}



export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");

  // Load clients from localStorage
  useEffect(() => {
    const loadClients = () => {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      setClients(savedClients);
      const uniqueLocations = ["All", ...Array.from(new Set(savedClients.map((c: Client) => c.location).filter(Boolean)))];
      setLocations(uniqueLocations); //ignore error
      setIsLoading(false);
    };

    loadClients();
  }, []);

  // Handle opening add client page
  const handleAddClientClick = () => {
    navigate('/add-client');
  };

  // Handle client deletion
  const handleDeleteClient = (clientId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the client selection
    
    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this client?')) {
      // Remove client from state
      const updatedClients = clients.filter(client => client.id !== clientId);
      setClients(updatedClients);
      
      // Update localStorage
      localStorage.setItem('clients', JSON.stringify(updatedClients));
      
      toast.success('Client deleted successfully');
    }
  };

  // Handle client selection
  const handleClientClick = (client: Client) => {
    navigate(`/client/${client.id}`);
  };

  const filteredClients = clients.filter(client => selectedLocation === "All" || client.location === selectedLocation);

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

      <div className="dashboard-filters">
        <Label htmlFor="location-filter">Filter by Location</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="clients-grid">
        {filteredClients.map(client => (
          <Card 
            key={client.id}
            className="client-card"
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
                </div>
              </div>
              <button 
                className="delete-button"
                onClick={(e) => handleDeleteClient(client.id, e)}
                title="Delete client"
              >
                <XIcon className="h-4 w-4" />
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