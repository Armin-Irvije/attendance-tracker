// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, ChevronRightIcon, ClockIcon, BarChartIcon, PercentIcon, UserIcon, PlusIcon } from "lucide-react";
import './styles/dashboard.css';

// Sample data structure (replace with actual API calls)
interface AttendanceSummary {
  month: string;
  daysScheduled: number;
  daysAttended: number;
  attendancePercentage: number;
  totalHours: number;
}

interface Client {
  id: string;
  name: string;
  initials: string;
  image?: string;
}

export default function Dashboard() {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    month: 'May',
    daysScheduled: 22,
    daysAttended: 18,
    attendancePercentage: 82,
    totalHours: 54
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simulated data fetch
  useEffect(() => {
    // Simulate API call to fetch clients
    const fetchData = async () => {
      // This would be replaced with actual API calls
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockClients = [
        { id: '1', name: 'John Doe', initials: 'JD', image: '' },
        { id: '2', name: 'Sarah Smith', initials: 'SS', image: '' },
        { id: '3', name: 'Miguel Rodriguez', initials: 'MR', image: '' },
      ];
      
      setClients(mockClients);
      setCurrentClient(mockClients[0]);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  // Handle client change
  const handleClientChange = (client: Client) => {
    setCurrentClient(client);
    // In a real app, you'd fetch data for this specific client here
  };

  // Generate calendar days for the current month (weekdays only)
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= Math.min(daysInMonth, 14); i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Simulate random attendance (for demo purposes)
        const attended = Math.random() > 0.2;
        const hours = attended ? (Math.random() > 0.5 ? 3 : 2) : 0;
        
        days.push({
          date: i,
          attended,
          hours,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

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
      <header className="dashboard-header">
        <h1 className="dashboard-title">Attendance Dashboard</h1>
        <p className="dashboard-subtitle">Track and manage client attendance</p>
      </header>

      {/* Client selector */}
      <div className="client-selector">
        <div className="client-label">Current client:</div>
        <div className="client-avatars">
          {clients.map(client => (
            <Avatar 
              key={client.id}
              className={`client-avatar ${currentClient?.id === client.id ? 'selected' : ''}`}
              onClick={() => handleClientChange(client)}
            >
              <AvatarImage src={client.image} alt={client.name} />
              <AvatarFallback>{client.initials}</AvatarFallback>
            </Avatar>
          ))}
          <Avatar className="add-client-avatar">
            <AvatarFallback>
              <PlusIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="client-name">{currentClient?.name}</div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">Attendance Rate</CardDescription>
            <CardTitle className="stat-card-title">
              {summary.attendancePercentage}%
              <PercentIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">This month</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">Days Attended</CardDescription>
            <CardTitle className="stat-card-title">
              {summary.daysAttended}/{summary.daysScheduled}
              <CalendarIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">Weekdays this month</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">Total Hours</CardDescription>
            <CardTitle className="stat-card-title">
              {summary.totalHours}
              <ClockIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">This month</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">Active Clients</CardDescription>
            <CardTitle className="stat-card-title">
              {clients.length}
              <UserIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Month preview */}
      <div>
        <div className="calendar-header">
          <h2 className="calendar-title">May 2025</h2>
          <Button variant="outline" size="sm">
            View Full Calendar
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <div className="calendar-grid">
          {calendarDays.map((day, index) => (
            <Card 
              key={index} 
              className={`calendar-day ${day.attended ? 'calendar-day-attended' : 'calendar-day-absent'}`}
            >
              <CardContent className="calendar-day-content">
                <div className="calendar-day-header">
                  <span className="calendar-day-number">{day.date}</span>
                  <span className="calendar-day-name">{day.dayName}</span>
                </div>
                <div className="calendar-day-status">
                  <div className={`status-indicator ${day.attended ? 'status-indicator-attended' : 'status-indicator-absent'}`}></div>
                  {day.attended ? (
                    <span>{day.hours} hours</span>
                  ) : (
                    <span>Absent</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="action-buttons">
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Record Attendance
        </Button>
        <Button variant="outline">
          <BarChartIcon className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
    </div>
  );
}