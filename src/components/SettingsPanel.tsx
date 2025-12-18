import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Settings, Shield, Users, Bell, Key } from 'lucide-react';
import type { User } from '@/types/dashboard.types';
import { toast } from 'sonner';
import { privateApiCall, privateApiPost } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/auth.slice';
import { Skeleton } from './ui/skeleton';

interface SettingsPanelProps {
  user: User;
}

export function SettingsPanel({ user }: SettingsPanelProps) {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState({
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [currentUser, setCurrentUser] = useState(user);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const originalValues = useRef({
    name: user.name || '',
    email: user.email || ''
  });

  // Update local state when user prop changes (from Redux, synced by layout)
  useEffect(() => {
    // Check if user data is available (from Redux, synced by layout)
    if (user && user.name && user.email) {
      const updatedUser: User = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'admin'
      };
      
      setCurrentUser(updatedUser);
      
      // Update original values and profile when user data changes
      originalValues.current = {
        name: user.name || '',
        email: user.email || ''
      };
      
      setProfile({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setIsInitializing(false);
    } else if (user && user.id) {
      // User exists but name/email might be loading, keep skeleton visible
      setIsInitializing(true);
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    importAlerts: true,
    exportAlerts: false,
    weeklyReports: true
  });

  const handleProfileUpdate = async () => {
    if (!profile.name) {
      toast.error('Please fill in your full name');
      return;
    }

    // Check if there are any changes
    const hasNameChange = profile.name !== originalValues.current.name;
    const hasPasswordChange = profile.currentPassword && profile.newPassword;

    // If no changes, show message and return
    if (!hasNameChange && !hasPasswordChange) {
      toast.info('No changes to update');
      return;
    }

    // Validate password fields if new password is provided
    if (profile.newPassword) {
      if (!profile.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }

      if (profile.newPassword !== profile.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (profile.newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long');
        return;
      }
    }

    setIsUpdating(true);

    try {
      // Prepare request data according to API format
      const requestData: any = {
        data: {}
      };

      // Only include name if it has changed
      if (hasNameChange) {
        requestData.data.name = profile.name;
      }

      // Add password fields if password change is requested
      if (hasPasswordChange) {
        requestData.data.password = profile.currentPassword;
        requestData.data.newPassword = profile.newPassword;
      }

      // Make API call to update profile
      const response = await privateApiPost<{ message: string; admin?: any }>(
        '/auth/me',
        requestData
      );

      // Show success message
      toast.success(response.message || 'Profile updated successfully');

      // Fetch updated user data from GET API
      try {
        const updatedUserResponse = await privateApiCall<{ admin: any }>('/auth/me');
        
        if (updatedUserResponse.admin) {
          const adminData = updatedUserResponse.admin;
          const updatedUser: User = {
            id: adminData._id || adminData.id,
            name: adminData.name || '',
            email: adminData.email || '',
            role: adminData.role || currentUser.role || 'admin'
          };
          
          // Update original values to reflect the new state
          originalValues.current = {
            name: adminData.name || '',
            email: adminData.email || ''
          };
          
          // Update local state
          setCurrentUser(updatedUser);
          setProfile({
            name: adminData.name || '',
            email: adminData.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });

          // Update Redux store to refresh sidebar and header
          dispatch(updateUser({
            name: adminData.name,
            email: adminData.email
          }));
        }
      } catch (error: any) {
        console.error('Failed to fetch updated user data:', error);
        // Still clear password fields even if fetch fails
        setProfile({
          ...profile,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationUpdate = () => {
    toast.success('Notification preferences updated');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Settings */}
      <Card className="border-0 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        {/* Gradient Header */}
        <div 
          className="h-24 relative overflow-hidden"
          style={{
            background: currentUser.role === 'superadmin' 
              ? 'linear-gradient(135deg, #FFF5E6 0%, #FFE5CC 50%, #FFDBB8 100%)'
              : 'linear-gradient(135deg, #FFF5E6 0%, #FFE5CC 50%, #FFDBB8 100%)'
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20" 
            style={{ 
              background: `radial-gradient(circle, ${currentUser.role === 'superadmin' ? '#2563EB' : '#2563EB'} 0%, transparent 70%)`
            }}
          ></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10"
            style={{ 
              background: `radial-gradient(circle, ${currentUser.role === 'superadmin' ? '#2563EB' : '#2563EB'} 0%, transparent 70%)`
            }}
          ></div>
          
          {/* Icon Badge */}
          <div className="absolute bottom-4 left-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: currentUser.role === 'superadmin' 
                  ? 'linear-gradient(135deg, #2563EB 0%, #FF9F5A 100%)'
                  : 'linear-gradient(135deg, #2563EB 0%, #FF9F5A 100%)'
              }}
            >
              <Settings className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <CardHeader className="pt-6">
          <CardTitle className="flex items-center justify-between">
            <span>Profile Settings</span>
            <Badge 
              variant={currentUser.role === 'superadmin' ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              {currentUser.role === 'superadmin' && <Shield className="w-3 h-3 mr-1" />}
              {currentUser.role === 'superadmin' ? 'Owner' : 'Admin'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInitializing ? (
            <>
              {/* User Info Card Skeleton */}
              <div className="flex items-center space-x-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/50">
                <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Password Section Skeleton */}
              <Separator className="my-6" />
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Update Button Skeleton */}
              <div className="pt-2">
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/50">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden group"
                  style={{ 
                    background: currentUser.role === 'superadmin' 
                      ? 'linear-gradient(135deg, #2563EB 0%, #FF9F5A 100%)'
                      : 'linear-gradient(135deg, #EB432F 0%, #FF5A47 100%)'
                  }}
                >
                  <span className="text-white relative z-10 transition-transform duration-300 group-hover:scale-110">
                    {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                  </span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1">{currentUser.name || 'User'}</h3>
                  <p className="text-sm text-gray-600">{currentUser.email || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e: { target: { value: string } }) => setProfile({...profile, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    background: currentUser.role === 'superadmin' 
                      ? 'linear-gradient(135deg, #2563EB 0%, #FF9F5A 100%)'
                      : 'linear-gradient(135deg, #EB432F 0%, #FF5A47 100%)'
                  }}
                >
                  <Key className="w-4 h-4 text-white" />
                </div>
                <h4>Change Password</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <PasswordInput
                    id="current-password"
                    value={profile.currentPassword}
                    onChange={(e: any) => setProfile({...profile, currentPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput
                    id="new-password"
                    value={profile.newPassword}
                    onChange={(e: any) => setProfile({...profile, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <PasswordInput
                    id="confirm-password"
                    value={profile.confirmPassword}
                    onChange={(e: any) => setProfile({...profile, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating || isInitializing}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: currentUser.role === 'superadmin' 
                      ? 'linear-gradient(135deg, #2563EB 0%, #FF9F5A 100%)'
                      : 'linear-gradient(135deg, #EB432F 0%, #FF5A47 100%)'
                  }}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        {/* Gradient Header */}
        <div 
          className="h-24 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E8F5FF 0%, #D6ECFF 50%, #C4E3FF 100%)'
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
          
          {/* Icon Badge */}
          <div className="absolute bottom-4 left-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600"
            >
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <CardHeader className="pt-6">
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 hover:border-blue-200 transition-colors duration-300">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.emailNotifications}
              onCheckedChange={(checked: boolean) => setNotifications({...notifications, emailNotifications: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 hover:border-blue-200 transition-colors duration-300">
            <div>
              <Label htmlFor="import-alerts">Import Alerts</Label>
              <p className="text-sm text-gray-600">Get notified when data imports complete</p>
            </div>
            <Switch
              id="import-alerts"
              checked={notifications.importAlerts}
              onCheckedChange={(checked: boolean) => setNotifications({...notifications, importAlerts: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 hover:border-blue-200 transition-colors duration-300">
            <div>
              <Label htmlFor="export-alerts">Export Alerts</Label>
              <p className="text-sm text-gray-600">Get notified when data exports complete</p>
            </div>
            <Switch
              id="export-alerts"
              checked={notifications.exportAlerts}
              onCheckedChange={(checked: boolean) => setNotifications({...notifications, exportAlerts: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 hover:border-blue-200 transition-colors duration-300">
            <div>
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-gray-600">Receive weekly activity summaries</p>
            </div>
            <Switch
              id="weekly-reports"
              checked={notifications.weeklyReports}
              onCheckedChange={(checked: boolean) => setNotifications({...notifications, weeklyReports: checked})}
            />
          </div>

          <Button onClick={handleNotificationUpdate} variant="outline">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}