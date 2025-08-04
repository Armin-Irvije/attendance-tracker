import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon, Trash2Icon } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { PercentIcon, CalendarIcon, ClockIcon, BarChartIcon, CheckIcon, XIcon } from "lucide-react"
import { useParams, useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import '../styles/clientPage.css';
import { toast } from 'sonner';
import { supabaseHelpers } from '../supabase-client.js';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  parent_email?: string;
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
    [month: string]: "Funding" | "Not Funded";
  };
  strikes?: {
    [month: string]: number;
  };
  createdAt?: string; // ISO date string when client was created
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
  const [strikes, setStrikes] = useState<number>(0);
  const [excusedAbsences, setExcusedAbsences] = useState<number>(0);

  // Get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get week range string (Monday through Friday)
  function getWeekRange(startDate: Date): string {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday is 4 days after Monday
    
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
    
    // Get client creation date, default to month start if not set
    const clientCreatedAt = client.createdAt ? new Date(client.createdAt) : monthStart;
    const effectiveStartDate = clientCreatedAt > monthStart ? clientCreatedAt : monthStart;
    
    let daysScheduled = 0;
    let daysAttended = 0;
    let totalHours = 0;
    
    const clientSchedule = client.schedule || {};

    // Iterate through all days in the month from when client was created
    for (let date = new Date(effectiveStartDate); date <= monthEnd; date.setDate(date.getDate() + 1)) {
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

  // Calculate strikes for current month
  const calculateStrikes = (client: Client, currentWeek: Date): number => {
    const monthStart = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
    const monthEnd = new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
    
    // Get client creation date, default to month start if not set
    const clientCreatedAt = client.createdAt ? new Date(client.createdAt) : monthStart;
    const effectiveStartDate = clientCreatedAt > monthStart ? clientCreatedAt : monthStart;
    
    let unexcusedAbsences = 0;
    const clientSchedule = client.schedule || {};

    // Iterate through all days in the month from when client was created
    for (let date = new Date(effectiveStartDate); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = client.attendance?.[dateStr];
      
      // Check if day was scheduled but student was absent without excuse
      if (clientSchedule[dayName as keyof typeof clientSchedule] && 
          attendanceRecord && 
          !attendanceRecord.attended && 
          !attendanceRecord.excused) {
        unexcusedAbsences++;
      }
    }
    
    return unexcusedAbsences;
  };

  // Calculate excused absences for current month
  const calculateExcusedAbsences = (client: Client, currentWeek: Date): number => {
    const monthStart = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
    const monthEnd = new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
    
    // Get client creation date, default to month start if not set
    const clientCreatedAt = client.createdAt ? new Date(client.createdAt) : monthStart;
    const effectiveStartDate = clientCreatedAt > monthStart ? clientCreatedAt : monthStart;
    
    let excusedAbsences = 0;
    const clientSchedule = client.schedule || {};

    // Iterate through all days in the month from when client was created
    for (let date = new Date(effectiveStartDate); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = client.attendance?.[dateStr];
      
      // Check if day was scheduled but student was absent with excuse
      if (clientSchedule[dayName as keyof typeof clientSchedule] && 
          attendanceRecord && 
          !attendanceRecord.attended && 
          attendanceRecord.excused) {
        excusedAbsences++;
      }
    }
    
    return excusedAbsences;
  };

  // Check for strike warnings and send notifications
  const checkStrikeWarnings = (newStrikes: number, client: Client) => {
    if (newStrikes === 2) {
      showStrikeWarning(2, client);
    } else if (newStrikes === 3) {
      showStrikeWarning(3, client);
    }
  };

  // Show strike warning notification
  const showStrikeWarning = (strikeCount: number, client: Client) => {
    const month = getMonthName(currentWeekStart);
    const warningMessage = `⚠️ ATTENDANCE WARNING: ${client.name} has ${strikeCount} unexcused absence${strikeCount > 1 ? 's' : ''} this month (${month}).`;
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Attendance Warning', {
        body: warningMessage,
        icon: '/favicon.ico'
      });
    }
    
    // Show toast notification
    toast.warning(warningMessage, {
      duration: 5000,
      action: {
        label: 'Send Email',
        onClick: () => sendParentEmail(client, strikeCount)
      }
    });
  };

  // Send email to parent
  const sendParentEmail = (client: Client, strikeCount: number) => {
    if (!client.parent_email) {
      toast.error('No parent email address found for this client.');
      return;
    }

    const month = getMonthName(currentWeekStart);
    const subject = `Attendance Warning - ${client.name}`;
    const body = `Dear Parent/Guardian,

This is an automated attendance notification for ${client.name}.

${client.name} has ${strikeCount} unexcused absence${strikeCount > 1 ? 's' : ''} this month (${month}).

Please ensure regular attendance to avoid further consequences.

Best regards,
Attendance System`;

    // Open email client with pre-filled content
    const mailtoLink = `mailto:${client.parent_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast.success('Email client opened. Please send the email manually.');
  };

  useEffect(() => {
    const loadClient = async () => {
      try {
        const foundClient = await supabaseHelpers.getClientWithAttendance(clientId!);
        
        if (foundClient) {
          setClient(foundClient);
          if (foundClient.schedule) {
            setSchedule(foundClient.schedule);
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error loading client:', error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [clientId, navigate]);

  // Calculate attendance summary for current month
  useEffect(() => {
    if (!client) return;

    const monthlyStats = calculateMonthlyStats(client, currentWeekStart);
    setSummary(monthlyStats);
  }, [client, currentWeekStart]);

  // Update strikes when attendance changes
  useEffect(() => {
    if (!client) return;
    
    const currentStrikes = calculateStrikes(client, currentWeekStart);
    const currentExcusedAbsences = calculateExcusedAbsences(client, currentWeekStart);
    setStrikes(currentStrikes);
    setExcusedAbsences(currentExcusedAbsences);
    
    // Check for warnings (only for unexcused absences)
    checkStrikeWarnings(currentStrikes, client);
  }, [client, currentWeekStart]);

  // Generate 5 days of the current week (Monday through Friday)
  const generateWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 5; i++) {
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
  const handleAttendanceClick = async (day: CalendarDay) => {
    if (!client) return;

    const currentRecord = client.attendance?.[day.dateStr];
    console.log('Current attendance record:', currentRecord);
    
    let status = 'unexcused';
    let hours = 0;
    let excused = false;
    
    if (!currentRecord) {
      // First click: 2 hours
      status = 'present';
      hours = 2;
    } else if (currentRecord.attended && currentRecord.hours === 2) {
      // Second click: 3 hours
      status = 'present';
      hours = 3;
    } else if (currentRecord.attended && currentRecord.hours === 3) {
      // Third click: Excused absent
      status = 'excused';
      excused = true;
    } else if (currentRecord.excused) {
      // Fourth click: Unexcused absent
      status = 'unexcused';
    } else {
      // Fifth click (and beyond): Back to 2 hours
      status = 'present';
      hours = 2;
    }

    console.log('Updating attendance with:', { status, hours, excused });

    try {
      await supabaseHelpers.updateAttendance(client.id, day.dateStr, {
        status,
        hours,
        excused
      });
      
      console.log('Attendance updated successfully');
      
      // Reload client data to get updated attendance
      const updatedClient = await supabaseHelpers.getClientWithAttendance(client.id);
      console.log('Updated client data:', updatedClient);
      setClient(updatedClient);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    }
  };

  // Handle schedule change
  const handleScheduleChange = async (day: keyof typeof schedule) => {
    if (!client) return;

    const newSchedule = {
      ...schedule,
      [day]: !schedule[day]
    };
    setSchedule(newSchedule);

    try {
      await supabaseHelpers.updateClient(client.id, {
        schedule: newSchedule
      });
      // Reload client with attendance data
      const updatedClient = await supabaseHelpers.getClientWithAttendance(client.id);
      setClient(updatedClient);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Error updating schedule');
      // Revert the local state if the update failed
      setSchedule(schedule);
    }
  };

  const handlePayment = async () => {
    if (!client) return;

    const month = getMonthName(currentWeekStart);
    const currentStatus = client.paymentStatus?.[month];
    const newStatus = currentStatus === "Funding" ? "Not Funded" : "Funding";

    try {
      await supabaseHelpers.updateClientPaymentStatus(client.id, month, newStatus);
      // Reload client with attendance data
      const updatedClient = await supabaseHelpers.getClientWithAttendance(client.id);
      setClient(updatedClient);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error updating payment status');
    }
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

  const handleDeleteClient = async () => {
    if (!client) return;
    if (!window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;
    
    try {
      await supabaseHelpers.deleteClient(client.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error deleting client');
    }
  };

  // New: handle attendance selection
  const handleAttendanceSelect = async (day: CalendarDay, option: '2h' | '3h' | 'excused' | 'unexcused') => {
    if (!client) return;
    
    console.log('Handling attendance selection:', option, 'for day:', day.dateStr);
    
    try {
      let status = 'unexcused';
      let hours = 0;
      let excused = false;
      
      if (option === '2h') {
        status = 'present';
        hours = 2;
      } else if (option === '3h') {
        status = 'present';
        hours = 3;
      } else if (option === 'excused') {
        status = 'excused';
        excused = true;
      } else if (option === 'unexcused') {
        status = 'unexcused';
      }
      
      console.log('Updating attendance with:', { status, hours, excused });
      
      await supabaseHelpers.updateAttendance(client.id, day.dateStr, {
        status,
        hours,
        excused
      });
      
      console.log('Attendance selection updated successfully');
      
      // Reload client data to get updated attendance
      const updatedClient = await supabaseHelpers.getClientWithAttendance(client.id);
      console.log('Updated client data after selection:', updatedClient);
      setClient(updatedClient);
      setSelectedDayIndex(null); // Dismiss selection UI
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    }
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

        <Card className={`stat-card ${strikes > 0 ? 'strike-warning' : ''}`}>
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Unexcused Absences
            </CardDescription>
            <CardTitle className="stat-card-title">
              {strikes}
              <XIcon className="h-5 w-5 ml-2 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">{summary.monthName}</p>
            {strikes > 0 && (
              <div className="strike-actions">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => sendParentEmail(client, strikes)}
                  className="send-email-btn"
                >
                  Send Parent Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Excused Absences
            </CardDescription>
            <CardTitle className="stat-card-title">
              {excusedAbsences}
              <CheckIcon className="h-5 w-5 ml-2 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">{summary.monthName}</p>
          </CardContent>
        </Card>
      </div>

      {strikes >= 2 && (
        <Card className="strike-warning-card">
          <CardHeader>
            <CardTitle className="strike-warning-title">
              ⚠️ Attendance Warning
            </CardTitle>
            <CardDescription>
              {client.name} has {strikes} unexcused absence{strikes > 1 ? 's' : ''} this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="strike-warning-actions">
              <Button 
                variant="outline" 
                onClick={() => sendParentEmail(client, strikes)}
              >
                Send Parent Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            {client.paymentStatus && client.paymentStatus[summary.monthName] === "Funding" ? (
            <XIcon className="mr-2 h-4 w-4" />
          ) : (
            <CheckIcon className="mr-2 h-4 w-4" />
          )}  
            {client.paymentStatus && client.paymentStatus[summary.monthName] === "Funding" ? "Mark as Not Funded" : "Mark as Funding"}
        </Button>
      </div>
    </div>
  );
}