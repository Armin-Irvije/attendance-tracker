import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon, Trash2Icon } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { PercentIcon, CalendarIcon, ClockIcon, BarChartIcon, CheckIcon, XIcon } from "lucide-react"
import { useParams, useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import '../styles/clientPage.css';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  image?: string;
  location?: string;
  schedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
  };
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
      excused?: boolean;
    };
  };
  paymentStatus?: {
    [month: string]: "Paid" | "Unpaid";
  };
}

interface AttendanceSummary {
  weekRange: string;
  monthName: string;
  daysScheduled: number;
  daysAttended: number;
  attendancePercentage: number;
  totalHours: number;
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayName: string;
  attended: boolean;
  hours: number;
  isScheduled: boolean;
}

export default function ClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [summary, setSummary] = useState<AttendanceSummary>({
    weekRange: '',
    monthName: '',
    daysScheduled: 0,
    daysAttended: 0,
    attendancePercentage: 0,
    totalHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get week range string
  function getWeekRange(startDate: Date): string {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    
    return `${start} - ${end}`;
  }

  // Get month name from current week
  function getMonthName(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Calculate monthly attendance statistics
  function calculateMonthlyStats(client: Client, currentWeek: Date): AttendanceSummary {
    const monthStart = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
    const monthEnd = new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
    
    let daysScheduled = 0;
    let daysAttended = 0;
    let totalHours = 0;
    
    const clientSchedule = client.schedule || {};

    // Iterate through all days in the month
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = client.attendance?.[dateStr];
      
      if (clientSchedule[dayName as keyof typeof clientSchedule]) {
        daysScheduled++;
      }
      // Count as attended if attended, regardless of schedule
      if (attendanceRecord?.attended) {
        daysAttended++;
        totalHours += attendanceRecord.hours;
      }
    }
    
    return {
      weekRange: getWeekRange(currentWeek),
      monthName: getMonthName(currentWeek),
      daysScheduled,
      daysAttended,
      attendancePercentage: daysScheduled ? Math.round((daysAttended / daysScheduled) * 100) : 0,
      totalHours
    };
  }

  useEffect(() => {
    const loadClient = () => {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const foundClient = savedClients.find((c: Client) => c.id === clientId);
      
      if (foundClient) {
        setClient(foundClient);
        if (foundClient.schedule) {
          setSchedule(foundClient.schedule);
        }
      } else {
        navigate('/dashboard');
      }
      setIsLoading(false);
    };

    loadClient();
  }, [clientId, navigate]);

  // Calculate attendance summary for current month
  useEffect(() => {
    if (!client) return;

    const monthlyStats = calculateMonthlyStats(client, currentWeekStart);
    setSummary(monthlyStats);
  }, [client, currentWeekStart]);

  // Generate 7 days of the current week
  const generateWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = client?.attendance?.[dateStr];
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      
      const isScheduled = client?.schedule?.[dayName as keyof typeof client.schedule] || false;
      
      days.push({
        date,
        dateStr,
        dayNumber: date.getDate(),
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        attended: attendanceRecord?.attended || false,
        hours: attendanceRecord?.hours || 0,
        isScheduled
      });
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  // Handle attendance click
  const handleAttendanceClick = (day: CalendarDay) => {
    if (!client) return;

    const updatedClient = { ...client };
    if (!updatedClient.attendance) {
      updatedClient.attendance = {};
    }

    const currentRecord = updatedClient.attendance[day.dateStr];
    
    if (!currentRecord) {
      // First click: 2 hours
      updatedClient.attendance[day.dateStr] = {
        attended: true,
        hours: 2,
        excused: false
      };
    } else if (currentRecord.attended && currentRecord.hours === 2) {
      // Second click: 3 hours
      updatedClient.attendance[day.dateStr] = {
        attended: true,
        hours: 3,
        excused: false
      };
    } else if (currentRecord.attended && currentRecord.hours === 3) {
      // Third click: Excused absent
      updatedClient.attendance[day.dateStr] = {
        attended: false,
        hours: 0,
        excused: true
      };
    } else if (!currentRecord.attended && currentRecord.excused) {
      // Fourth click: Unexcused absent
      updatedClient.attendance[day.dateStr] = {
        attended: false,
        hours: 0,
        excused: false
      };
    } else {
      // Fifth click (and beyond): Back to 2 hours
      updatedClient.attendance[day.dateStr] = {
        attended: true,
        hours: 2,
        excused: false
      };
    }

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  // Handle schedule change
  const handleScheduleChange = (day: keyof typeof schedule) => {
    if (!client) return;

    const newSchedule = {
      ...schedule,
      [day]: !schedule[day]
    };
    setSchedule(newSchedule);

    const updatedClient = { ...client, schedule: newSchedule };

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  const handlePayment = () => {
    if (!client) return;

    const month = getMonthName(currentWeekStart);
    const updatedClient = { ...client };

    if (!updatedClient.paymentStatus) {
      updatedClient.paymentStatus = {};
    }

    // Toggle Paid/Unpaid
    if (updatedClient.paymentStatus[month] === "Paid") {
      updatedClient.paymentStatus[month] = "Unpaid";
    } else {
      updatedClient.paymentStatus[month] = "Paid";
    }

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleDeleteClient = () => {
    if (!client) return;
    if (!window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const updatedClients = savedClients.filter((c: Client) => c.id !== client.id);
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    navigate('/dashboard');
  };

  // New: handle attendance selection
  const handleAttendanceSelect = (day: CalendarDay, option: '2h' | '3h' | 'excused' | 'unexcused') => {
    if (!client) return;
    const updatedClient = { ...client };
    if (!updatedClient.attendance) {
      updatedClient.attendance = {};
    }
    if (option === '2h') {
      updatedClient.attendance[day.dateStr] = { attended: true, hours: 2, excused: false };
    } else if (option === '3h') {
      updatedClient.attendance[day.dateStr] = { attended: true, hours: 3, excused: false };
    } else if (option === 'excused') {
      updatedClient.attendance[day.dateStr] = { attended: false, hours: 0, excused: true };
    } else if (option === 'unexcused') {
      updatedClient.attendance[day.dateStr] = { attended: false, hours: 0, excused: false };
    }
    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }
    setClient(updatedClient);
    setSelectedDayIndex(null); // Dismiss selection UI
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const isCurrentWeek = getWeekRange(currentWeekStart) === getWeekRange(getWeekStart(new Date()));

  return (
    <div className="client-page-container">
      <header className="client-header">
        <h1 className="client-title">{client.name}'s Attendance</h1>
        <div className="client-header-actions">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <button className="delete-client-btn" title="Delete client" onClick={handleDeleteClient}>
            <Trash2Icon className="trash-icon" />
          </button>
        </div>
      </header>

      {/* Schedule Configuration */}
      <Card className="schedule-config">
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
          <CardDescription>Select the days this client is scheduled to attend.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="schedule-grid">
            {Object.entries(schedule).map(([day, checked]) => (
              <div key={day} className="schedule-item" onClick={() => handleScheduleChange(day as keyof typeof schedule)}>
                <Checkbox
                  id={`schedule-${day}`}
                  checked={checked}
                  onCheckedChange={() => handleScheduleChange(day as keyof typeof schedule)}
                  className="schedule-checkbox"
                />
                <Label htmlFor={`schedule-${day}`} className="schedule-label">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="stats-grid">
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Attendance Rate
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.attendancePercentage}%
              <PercentIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">{summary.monthName}</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Days Attended
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.daysAttended}/{summary.daysScheduled}
              <CalendarIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">Scheduled days in {summary.monthName}</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Total Hours
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.totalHours}
              <ClockIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">{summary.monthName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="calendar-section">
        <div className="calendar-header">
          <div className="week-navigation">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="calendar-title">{summary.weekRange}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Current Week
            </Button>
          )}
        </div>

        <div className="week-grid">
          {weekDays.map((day, index) => (
            <div key={index} className="week-grid-cell">
              {day ? (
                day.isScheduled && selectedDayIndex === index ? (
                  <>
                    <Card
                      className={`calendar-day calendar-day-clickable calendar-day-has-menu`}
                      style={{ zIndex: 2, position: 'relative' }}
                      onClick={() => setSelectedDayIndex(index)}
                    >
                      <CardContent className="calendar-day-content">
                        <div className="calendar-day-header">
                          <span className="calendar-day-number">{day.dayNumber}</span>
                          <span className="calendar-day-name">{day.dayName}</span>
                        </div>
                        <div className="calendar-day-status">
                          {day.attended ? (
                            <>
                              <div className={`status-indicator status-indicator-attended`}>
                                <CheckIcon className="h-3 w-3 text-white" />
                              </div>
                              <span>{day.hours} hours</span>
                            </>
                          ) : (
                            <>
                              <div className={`status-indicator status-indicator-absent`}>
                                <XIcon className="h-3 w-3 text-white" />
                              </div>
                              {day.isScheduled ? (
                                <span>{client?.attendance?.[day.dateStr]?.excused ? "Excused" : "Unexcused"}</span>
                              ) : (
                                <span className="unscheduled-text">Unscheduled</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="click-hint">
                          Click to select
                        </div>
                      </CardContent>
                    </Card>
                    <div className="attendance-selection-menu attendance-selection-menu-dropdown">
                      <button
                        className={`attendance-option-btn${client?.attendance?.[day.dateStr]?.attended && client?.attendance?.[day.dateStr]?.hours === 2 ? ' selected' : ''}`}
                        onClick={() => handleAttendanceSelect(day, '2h')}
                        style={{ background: '#d1fae5', border: '2px solid #6ee7b7', color: '#111', marginBottom: 8 }}
                      >
                        2 hours
                      </button>
                      <button
                        className={`attendance-option-btn${client?.attendance?.[day.dateStr]?.attended && client?.attendance?.[day.dateStr]?.hours === 3 ? ' selected' : ''}`}
                        onClick={() => handleAttendanceSelect(day, '3h')}
                        style={{ background: '#d1fae5', border: '2px solid #6ee7b7', color: '#111', marginBottom: 8 }}
                      >
                        3 hours
                      </button>
                      <button
                        className={`attendance-option-btn${client?.attendance?.[day.dateStr]?.excused ? ' selected' : ''}`}
                        onClick={() => handleAttendanceSelect(day, 'excused')}
                        style={{ background: '#fef3c7', border: '2px solid #fbbf24', color: '#111', marginBottom: 8 }}
                      >
                        Excused
                      </button>
                      <button
                        className={`attendance-option-btn${client?.attendance?.[day.dateStr] && !client?.attendance?.[day.dateStr]?.attended && !client?.attendance?.[day.dateStr]?.excused ? ' selected' : ''}`}
                        onClick={() => handleAttendanceSelect(day, 'unexcused')}
                        style={{ background: '#fee2e2', border: '2px solid #fca5a5', color: '#111' }}
                      >
                        Unexcused
                      </button>
                      <button
                        className="attendance-option-cancel"
                        style={{ marginTop: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#111' }}
                        onClick={() => setSelectedDayIndex(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <Card
                    className={`calendar-day ${
                      day.attended
                        ? "calendar-day-attended"
                        : day.isScheduled
                          ? (client?.attendance?.[day.dateStr]?.excused 
                              ? "calendar-day-excused" 
                              : "calendar-day-absent")
                          : "calendar-day-unscheduled"
                    } calendar-day-clickable`}
                    onClick={() => {
                      if (day.isScheduled) {
                        setSelectedDayIndex(index);
                      } else {
                        handleAttendanceClick(day);
                      }
                    }}
                  >
                    <CardContent className="calendar-day-content">
                      <div className="calendar-day-header">
                        <span className="calendar-day-number">{day.dayNumber}</span>
                        <span className="calendar-day-name">{day.dayName}</span>
                      </div>
                      <div className="calendar-day-status">
                        {day.attended ? (
                          <>
                            <div className={`status-indicator status-indicator-attended`}>
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                            <span>{day.hours} hours</span>
                          </>
                        ) : (
                          <>
                            <div className={`status-indicator status-indicator-absent`}>
                              <XIcon className="h-3 w-3 text-white" />
                            </div>
                            {day.isScheduled ? (
                              <span>{client?.attendance?.[day.dateStr]?.excused ? "Excused" : "Unexcused"}</span>
                            ) : (
                              <span className="unscheduled-text">Unscheduled</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="click-hint">
                        {day.isScheduled ? 'Click to select' : 'Click to toggle'}
                      </div>
                    </CardContent>
                  </Card>
                )
              ) : (
                <div className="calendar-day-empty" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="attendance-instructions">
        <Card>
          <CardContent className="instruction-content">
            <h3>How to track attendance:</h3>
            <ul>
              <li>Click on a scheduled day to mark as attended (2 hours)</li>
              <li>Click again to change to 3 hours</li>
              <li>Click once more to mark as excused absent</li>
              <li>Click once more to mark as unexcused absent</li>
              <li>All days can be clicked</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="action-buttons">
        <Button variant="outline">
          <BarChartIcon className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <Button onClick={handlePayment}>
          {client.paymentStatus && client.paymentStatus[summary.monthName] === "Paid" ? (
            <XIcon className="mr-2 h-4 w-4" />
          ) : (
            <CheckIcon className="mr-2 h-4 w-4" />
          )}
          {client.paymentStatus && client.paymentStatus[summary.monthName] === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}
        </Button>
      </div>
    </div>
  );
}