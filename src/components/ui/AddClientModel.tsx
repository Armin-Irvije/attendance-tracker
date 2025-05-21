// src/components/AddClientModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UserIcon, MailIcon, PhoneIcon, UserPlusIcon } from 'lucide-react';
import './add-client.css';

interface Client {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  image?: string;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Client) => void;
}

export function AddClientModal({ isOpen, onClose, onAddClient }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [initials, setInitials] = useState('');
  const [randomColor, setRandomColor] = useState('');

  // Generate a random pastel color for the avatar
  useEffect(() => {
    const colors = [
      'bg-blue-100 text-blue-600 border-blue-200',
      'bg-green-100 text-green-600 border-green-200',
      'bg-purple-100 text-purple-600 border-purple-200',
      'bg-amber-100 text-amber-600 border-amber-200',
      'bg-rose-100 text-rose-600 border-rose-200',
      'bg-emerald-100 text-emerald-600 border-emerald-200',
      'bg-indigo-100 text-indigo-600 border-indigo-200',
      'bg-cyan-100 text-cyan-600 border-cyan-200',
    ];
    setRandomColor(colors[Math.floor(Math.random() * colors.length)]);
  }, [isOpen]);

  // Update initials when name changes
  useEffect(() => {
    setInitials(generateInitials(formData.name));
  }, [formData.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    // Create new client object
    const newClient: Client = {
      id: Date.now().toString(), // Simple ID generation (use UUID in production)
      name: formData.name.trim(),
      initials: initials,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    // Add the client
    onAddClient(newClient);
    
    // Reset form and close modal
    setFormData({ name: '', email: '', phone: '' });
    onClose();
    
    // Confirmation toast
    toast.success(`${newClient.name} has been added as a client`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content sm:max-w-[500px] p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="modal-header">
            <DialogTitle className="modal-title flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-primary" />
              Add New Client
            </DialogTitle>
            <DialogDescription className="modal-description">
              Enter the client's information below to add them to your roster.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-body">
            {/* Client avatar preview */}
            <div className="flex justify-center mb-6">
              <div className={`client-avatar-preview ${randomColor} ${initials ? 'client-avatar-animation' : ''}`}>
                {initials || <UserIcon className="h-8 w-8 opacity-50" />}
              </div>
            </div>
          
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
                <p className="form-field-helper">
                  This name will appear on all attendance records.
                </p>
              </div>
              
              <div className="form-field">
                <Label htmlFor="email" className="form-field-label">
                  Email Address
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
            </div>
          </div>
          
          <DialogFooter className="modal-footer">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              Add Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}