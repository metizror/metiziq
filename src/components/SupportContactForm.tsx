import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { privateApiPost } from '@/lib/api';

interface SupportContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function SupportContactForm({ isOpen, onClose, userEmail, userName }: SupportContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    subject: '',
    category: '',
    message: '',
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await privateApiPost('/customers/support', {
        name: formData.name,
        email: formData.email,
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
      });

      setIsSubmitting(false);
      toast.success(
        response?.message ||
          `Support request submitted successfully for "${formData.subject}".`
      );

        setFormData({
          name: userName || '',
          email: userEmail || '',
          subject: '',
          category: '',
          message: '',
        });
        onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit support request';
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            Contact Support
          </DialogTitle>
          <DialogDescription>
            Need help? Send us a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: { target: { value: string } }) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: { target: { value: string } }) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className="h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) => handleInputChange('category', value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="billing">Billing & Payment</SelectItem>
                <SelectItem value="account">Account Management</SelectItem>
                <SelectItem value="data">Data & Downloads</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e: { target: { value: string } }) => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your request"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e: { target: { value: string } }) => handleInputChange('message', e.target.value)}
              placeholder="Please provide as much detail as possible about your request..."
              rows={6}
              className="resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              Minimum 20 characters ({formData.message.length}/20)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Response Time</p>
                <p>Our support team typically responds within 24 hours during business days.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              style={{ backgroundColor: '#2563EB' }}
              disabled={isSubmitting || formData.message.length < 20}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
