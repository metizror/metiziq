import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Download, AlertCircle, CheckCircle, Building, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadRestrictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (contacts: number, maxPerCompany: number) => void;
  totalSelectedContacts: number;
}

export function DownloadRestrictionsModal({ 
  isOpen, 
  onClose, 
  onDownload,
  totalSelectedContacts 
}: DownloadRestrictionsModalProps) {
  const [contactsToDownload, setContactsToDownload] = useState(totalSelectedContacts);
  const [maxContactsPerCompany, setMaxContactsPerCompany] = useState([10] as number[]);
  const [dailyLimit] = useState(10000);
  const [dailyUsed] = useState(245); // Mock current usage
  const [saveSearch, setSaveSearch] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const MIN_DOWNLOAD = 50;
  const MAX_DOWNLOAD = 10000;
  const PRICE_PER_CONTACT = 0.40;

  useEffect(() => {
    setContactsToDownload(Math.max(MIN_DOWNLOAD, Math.min(totalSelectedContacts, MAX_DOWNLOAD)));
  }, [totalSelectedContacts]);

  const handleDownload = () => {
    if (contactsToDownload < MIN_DOWNLOAD) {
      toast.error(`Minimum download is ${MIN_DOWNLOAD} contacts`);
      return;
    }

    if (dailyUsed + contactsToDownload > dailyLimit) {
      toast.error(`This download would exceed your daily limit of 10,000 contacts. Please contact Owner to request additional downloads.`);
      return;
    }

    const totalCost = contactsToDownload * PRICE_PER_CONTACT;
    toast.success(`Downloading ${contactsToDownload} contacts as XLS file for ${totalCost.toFixed(2)}. Owner has been notified.`);
    onDownload(contactsToDownload, maxContactsPerCompany[0]);
    onClose();
  };

  const remainingToday = dailyLimit - dailyUsed;
  const totalCost = contactsToDownload * PRICE_PER_CONTACT;
  const effectiveDownload = Math.min(contactsToDownload, remainingToday);

  const handleRequestMoreDownloads = () => {
    if (requestMessage.trim()) {
      toast.success('Your request has been sent to the Owner team');
      setShowRequestModal(false);
      setRequestMessage('');
    } else {
      toast.error('Please provide a reason for your request');
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            Download Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your download preferences and restrictions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Daily Limit Warning */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-2">Daily Download Limit</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-700">
                    Used: <span className="font-medium">{dailyUsed.toLocaleString()}</span> / {dailyLimit.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-blue-900">
                    Remaining: {remainingToday.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${(dailyUsed / dailyLimit) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-xs text-blue-700 hover:text-blue-900 underline mt-2"
                >
                  Need more than 10,000 contacts? Request from Owner →
                </button>
              </div>
            </div>
          </div>

          {/* Number of Contacts */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Number of Contacts to Download</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={MIN_DOWNLOAD}
                max={Math.min(totalSelectedContacts, MAX_DOWNLOAD, remainingToday)}
                value={contactsToDownload}
                onChange={(e: { target: { value: string } }) => setContactsToDownload(Math.max(MIN_DOWNLOAD, parseInt(e.target.value) || MIN_DOWNLOAD))}
                className="h-12 text-lg"
              />
              <div className="flex-shrink-0">
                <div className="text-sm text-gray-600">Selected</div>
                <div className="text-lg font-semibold text-gray-900">{totalSelectedContacts.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Minimum: {MIN_DOWNLOAD} contacts</span>
              <span className="text-gray-600">Maximum: {MAX_DOWNLOAD.toLocaleString()} per day</span>
            </div>

            {contactsToDownload < MIN_DOWNLOAD && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span>Minimum {MIN_DOWNLOAD} contacts required</span>
              </div>
            )}
          </div>

          {/* Max Contacts Per Company Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Max Contacts Per Company</Label>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg">
                <Building className="w-4 h-4" />
                <span className="font-semibold">{maxContactsPerCompany[0]}</span>
              </div>
            </div>
            
            <Slider
              value={maxContactsPerCompany}
              onValueChange={setMaxContactsPerCompany}
              min={1}
              max={25}
              step={1}
              className="py-4"
            />
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>1 contact</span>
              <span>25 contacts</span>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Limit the number of contacts downloaded from each company to ensure diversity in your dataset.
              </p>
            </div>
          </div>

          {/* Cost Calculation */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pay-Per-Contact Pricing</p>
                <p className="text-3xl font-semibold text-gray-900">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Contacts to download:</span>
                <span className="font-medium text-gray-900">{effectiveDownload.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price per contact:</span>
                <span className="font-medium text-gray-900">${PRICE_PER_CONTACT.toFixed(2)}</span>
              </div>
              <div className="h-px bg-green-200 my-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Total cost:</span>
                <span className="text-lg font-semibold text-green-700">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 text-xs text-green-800 bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>No subscriptions, no hidden fees — pay only for what you download</p>
            </div>
          </div>

          {/* Save Search Option */}
          <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">Save this search</p>
              <p className="text-sm text-gray-600">You can save up to 5 searches for quick access</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={saveSearch}
                onChange={(e: { target: { checked: boolean } }) => setSaveSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Download Format & History Note */}
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Download Format</p>
                  <p className="text-sm text-blue-800">
                    All downloads are provided in <strong>XLS format only</strong> for maximum compatibility.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Download History & Notifications</p>
                  <p className="text-sm text-yellow-800">
                    Downloads are retained in "My Downloads" for 24 hours only. Owner will be notified of all downloads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleDownload}
            style={{ backgroundColor: '#EF8037' }}
            disabled={contactsToDownload < MIN_DOWNLOAD || effectiveDownload + dailyUsed > dailyLimit}
            className="min-w-[200px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download for ${totalCost.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Request More Downloads Modal */}
    <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Request Additional Downloads
          </DialogTitle>
          <DialogDescription>
            Need to download more than 10,000 contacts per day? Send your request to the Owner team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Current daily limit:</strong> 10,000 contacts<br />
              <strong>Already used today:</strong> {dailyUsed.toLocaleString()} contacts<br />
              <strong>Remaining:</strong> {remainingToday.toLocaleString()} contacts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-message">Reason for Request</Label>
            <textarea
              id="request-message"
              value={requestMessage}
              onChange={(e: { target: { value: string } }) => setRequestMessage(e.target.value)}
              placeholder="Please explain why you need more than 10,000 contacts per day..."
              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                The Owner team will review your request and respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => setShowRequestModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRequestMoreDownloads}
            style={{ backgroundColor: '#9333ea' }}
            className="min-w-[150px]"
          >
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
