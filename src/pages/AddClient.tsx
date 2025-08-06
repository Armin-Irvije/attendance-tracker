import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { UserIcon, MailIcon, PhoneIcon, UserPlusIcon, MapPinIcon } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import '../styles/add-client.css';
import { supabaseHelpers } from '../supabase-client.js';

export default function AddClient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    parentName: '',
    email: '',
    phone: '',
    location: '',
  });
  const [schedule, setSchedule] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  });
  const [initials, setInitials] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);



  // Update initials when name changes
  useEffect(() => {
    setInitials(generateInitials(formData.name));
  }, [formData.name]);

  // Update selected days when schedule changes
  useEffect(() => {
    const days = Object.entries(schedule)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
    setSelectedDays(days);
  }, [schedule]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (day: keyof typeof schedule) => {
    setSchedule(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const generateInitials = (name: string) => {
    if (!name.trim()) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!formData.parentName.trim()) {
      toast.error("Parent name is required");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day for the client's schedule");
      return;
    }

    try {
      // Create new client in Supabase
      const newClient = await supabaseHelpers.createClient({
        name: formData.name.trim(),
        initials: initials,
        parent_name: formData.parentName.trim(),
        parent_email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        schedule: schedule
      });

      // Show success message and navigate back to dashboard
      toast.success(`${newClient.name} has been added as a client`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Error adding client');
    }
  };

  return (
    <div className="add-client-page">
      <div className="add-client-container">
        <header className="page-header">
          <h1 className="page-title">Add New Client</h1>
          <p className="page-description">Enter the client's information and schedule below.</p>
        </header>

        <form onSubmit={handleSubmit} className="add-client-form">


          <div className="form-sections">
            {/* Personal Information Section */}
            <section className="form-section">
              <h2 className="section-title">Personal Information</h2>
              <div className="space-y-5">
                <div className="form-field">
                  <Label htmlFor="name" className="form-field-label">
                    Full Name <span className="form-field-required">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="form-field-icon h-4 w-4" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-field-input"
                      placeholder="John Smith"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="form-field">
                  <Label htmlFor="parentName" className="form-field-label">
                    Parent Name <span className="form-field-required">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="form-field-icon h-4 w-4" />
                    <Input
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className="form-field-input"
                      placeholder="Parent Name"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <Label htmlFor="email" className="form-field-label">
                    Parent Email Address
                  </Label>
                  <div className="relative">
                    <MailIcon className="form-field-icon h-4 w-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-field-input"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <Label htmlFor="phone" className="form-field-label">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <PhoneIcon className="form-field-icon h-4 w-4" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-field-input"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <Label htmlFor="location" className="form-field-label">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPinIcon className="form-field-icon h-4 w-4" />
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="form-field-input"
                      placeholder="e.g., Main Street Center"
                    />
                  </div>
                </div>

              </div>
            </section>

            {/* Schedule Section */}
            <section className="form-section">
              <h2 className="section-title">Weekly Schedule</h2>
              <div className="schedule-grid">
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                  <div key={day} className="schedule-item">
                    <Checkbox
                      id={day}
                      checked={schedule[day]}
                      onCheckedChange={() => handleScheduleChange(day)}
                      className="schedule-checkbox"
                    />
                    <Label htmlFor={day} className="schedule-label">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <div className="selected-days">
                  <p className="selected-days-text">
                    Selected days: {selectedDays.join(', ')}
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="submit-button"
            >
              <UserPlusIcon className="submit-button-icon" />
              <p className="submit-button-text">Add Client</p>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 