// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";
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
  schedule: Record<string, boolean>;
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
    };
  };
}

// Add this sample data
const sampleClients: Client[] = [
  {
    id: '1',
    name: 'John Doe',
    initials: 'JD',
    email: 'john@example.com',
    schedule: {
      'monday': true,
      'wednesday': true,
      'friday': true
    },
    attendance: {
      '2024-03-15': { attended: true, hours: 3 },
      '2024-03-18': { attended: true, hours: 2 },
      '2024-03-20': { attended: false, hours: 0 }
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    initials: 'JS',
    email: 'jane@example.com',
    schedule: {
      'tuesday': true,
      'thursday': true
    },
    attendance: {
      '2024-03-19': { attended: true, hours: 3 },
      '2024-03-21': { attended: true, hours: 3 }
    }
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load clients from localStorage
  useEffect(() => {
    const loadClients = () => {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      setClients(savedClients);
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

      <div className="clients-grid">
        {clients.map(client => (
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