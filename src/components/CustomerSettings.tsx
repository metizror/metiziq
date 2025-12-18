import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, CreditCard, Shield, Trash2, Save, Upload, Camera, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { PasswordInput } from './ui/password-input';
import { privateApiPost, privateApiCall } from '@/lib/api';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/auth.slice';

export default function CustomerSettings() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [activeSection, setActiveSection] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequestSent, setDeleteRequestSent] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Billing state
  const [billingAddress, setBillingAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [isUpdatingBilling, setIsUpdatingBilling] = useState(false);

  // Initialize profile and billing data
  useEffect(() => {
    // We can rely on activeSection effect to fetch data
  }, []);

  // Fetch billing address and profile when section changes
  useEffect(() => {
    if (activeSection === 'billing' || activeSection === 'profile') {
      const fetchProfile = async () => {
        try {
          // Use privateApiCall for GET request (privateApiCall defaults to GET)
          const response = await privateApiCall<{ customer: any }>('/customers/setting/profile');
          if (response?.customer) {
            // Update profile data if active
            if (activeSection === 'profile') {
              setProfileData({
                firstName: response.customer.firstName || '',
                lastName: response.customer.lastName || '',
                email: response.customer.email || '',
                companyName: response.customer.companyName || '',
              });
            }

            // Update billing data
            if (response.customer.billingAddress) {
              setBillingAddress({
                streetAddress: response.customer.billingAddress.streetAddress || '',
                city: response.customer.billingAddress.city || '',
                state: response.customer.billingAddress.state || '',
                zipCode: response.customer.billingAddress.zipCode || '',
                country: response.customer.billingAddress.country || '',
              });
            }
          }
        } catch (error) {
          console.error("Error fetching settings", error);
        }
      };

      fetchProfile();
    }
  }, [activeSection]);

  const handleBillingUpdate = async () => {
    setIsUpdatingBilling(true);
    try {
      const response = await privateApiPost<{ message: string }>('/customers/setting/profile', {
        billingAddress
      });
      toast.success(response.message || 'Billing address updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update billing address';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingBilling(false);
    }
  };


  const handleDeleteRequest = () => {
    // Send delete request to Owner
    console.log('Delete account request sent to Owner');
    setDeleteRequestSent(true);
    setShowDeleteConfirm(false);
    // In real implementation, this would make an API call
  };

  // Validate password fields
  const validatePassword = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  // Handle password change
  const handlePasswordChange = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await privateApiPost<{ message: string }>('/customers/setting/security', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(response.message || 'Password updated successfully');

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update password';
      toast.error(errorMessage);

      // Set specific error for current password if it's incorrect
      if (errorMessage.toLowerCase().includes('current password') || errorMessage.toLowerCase().includes('incorrect')) {
        setPasswordErrors((prev: { currentPassword: string; newPassword: string; confirmPassword: string }) => ({
          ...prev,
          currentPassword: 'Current password is incorrect',
        }));
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle input changes
  const handlePasswordInputChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordData((prev: { currentPassword: string; newPassword: string; confirmPassword: string }) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev: { currentPassword: string; newPassword: string; confirmPassword: string }) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    setIsUpdatingProfile(true);
    try {
      const response = await privateApiPost<{ message: string }>('/customers/setting/profile', {
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        companyName: profileData.companyName || '',
      });

      toast.success(response.message || 'Profile updated successfully');

      // Update Redux state to reflect changes everywhere in the dashboard
      const updatedName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user?.email || '';
      dispatch(updateUser({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        companyName: profileData.companyName || '',
        name: updatedName, // Update name so it reflects in sidebar and header
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'JD';
  };

  // Get user full name
  const getUserFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'security', label: 'Security', icon: Lock, gradient: 'from-green-500 to-emerald-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, gradient: 'from-purple-500 to-pink-500' },
    { id: 'billing', label: 'Billing', icon: CreditCard, gradient: 'from-orange-500 to-red-500' },
    { id: 'privacy', label: 'Privacy', icon: Shield, gradient: 'from-red-500 to-rose-500' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
        <div>
          <h1 className="text-[#030000]">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation - Enhanced */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
            <div className="mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Settings Menu</p>
            </div>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden ${isActive
                      ? 'bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>
                    )}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative z-10 ${isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                      <Icon size={18} className={isActive ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <span className="relative z-10">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === 'profile' && (
              <>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <h2 className="text-[#030000]">Profile Information</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                      <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
                        <div className="relative group">
                          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#EF8037] to-[#EB432F] flex items-center justify-center text-white text-3xl shadow-xl group-hover:scale-105 transition-transform">
                            {getUserInitials()}
                          </div>
                          {/* <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                            <Camera className="text-white" size={18} />
                          </div> */}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[#030000] mb-2 capitalize">{getUserFullName()}</h3>
                          <p className="text-gray-600 mb-4">{user?.email || ''}</p>
                          {/* <div className="flex gap-3">
                            <button 
                              type="button"
                              className="px-5 py-2.5 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                            >
                              <Upload size={16} />
                              Upload Photo
                            </button>
                            <button 
                              type="button"
                              className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                              Remove
                            </button>
                          </div> */}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: (e.target as HTMLInputElement).value })}
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: (e.target as HTMLInputElement).value })}
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm text-gray-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm text-gray-700 mb-2">Company</label>
                          <input
                            type="text"
                            value={profileData.companyName}
                            onChange={(e) => setProfileData({ ...profileData, companyName: (e.target as HTMLInputElement).value })}
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="mt-6 px-8 py-4 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'security' && (
              <>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-full blur-3xl"></div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Lock className="text-white" size={20} />
                      </div>
                      <h2 className="text-[#030000]">Change Password</h2>
                    </div>

                    <form onSubmit={handlePasswordChange}>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                          <PasswordInput
                            value={passwordData.currentPassword}
                            onChange={(e: { target: { value: string } }) => handlePasswordInputChange('currentPassword', e.target.value)}
                            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-200'
                              }`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">New Password</label>
                          <PasswordInput
                            value={passwordData.newPassword}
                            onChange={(e: any) => handlePasswordInputChange('newPassword', (e.target as HTMLInputElement).value)}
                            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-200'
                              }`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                          )}
                          {!passwordErrors.newPassword && passwordData.newPassword && (
                            <p className="mt-1 text-xs text-gray-500">
                              Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
                          <PasswordInput
                            value={passwordData.confirmPassword}
                            onChange={(e: any) => handlePasswordInputChange('confirmPassword', (e.target as HTMLInputElement).value)}
                            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                              }`}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="mt-6 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              </>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bell className="text-white" size={20} />
                    </div>
                    <h2 className="text-[#030000]">Notification Preferences</h2>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: 'Email Notifications', desc: 'Receive email updates about your account', checked: true },
                      { title: 'Payment Reminders', desc: 'Get notified before your next billing date', checked: true },
                      { title: 'Download Notifications', desc: 'Get notified when your downloads are ready', checked: true },
                      { title: 'Product Updates', desc: 'Receive updates about new features and improvements', checked: false },
                      { title: 'Marketing Emails', desc: 'Receive promotional offers and newsletters', checked: false },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="text-[#030000] mb-1">{item.title}</p>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-3xl"></div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EF8037] to-[#EB432F] flex items-center justify-center">
                        <CreditCard className="text-white" size={20} />
                      </div>
                      <h2 className="text-[#030000]">Billing Address</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={billingAddress.streetAddress}
                          onChange={(e) => setBillingAddress({ ...billingAddress, streetAddress: e.target.value })}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={billingAddress.state}
                          onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={billingAddress.zipCode}
                          onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={billingAddress.country}
                          onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleBillingUpdate}
                      disabled={isUpdatingBilling}
                      className="mt-6 px-8 py-4 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingBilling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Address'
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-[#030000] mb-6">Auto-Renewal</h2>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                      <div>
                        <p className="text-[#030000] mb-1">Automatic Subscription Renewal</p>
                        <p className="text-gray-700 text-sm">Your subscription will automatically renew on the billing date</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'privacy' && (
              <>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">Comming soon...</div>
                {/* <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                      <Shield className="text-white" size={20} />
                    </div>
                    <h2 className="text-[#030000]">Data & Privacy</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <h3 className="text-[#030000] mb-2 flex items-center gap-2">
                        <Download size={18} className="text-blue-600" />
                        Download Your Data
                      </h3>
                      <p className="text-gray-700 mb-4 text-sm">Request a copy of all your personal data stored in our system</p>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                        Request Data Export
                      </button>
                    </div>

                    <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200">
                      <h3 className="text-[#030000] mb-2 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600" />
                        Delete Account
                      </h3>
                      <p className="text-gray-700 mb-4 text-sm">Request account deletion. Your request will be sent to the Owner for review and approval.</p>
                      {deleteRequestSent ? (
                        <div className="px-6 py-3 bg-green-100 text-green-700 rounded-xl border-2 border-green-300 flex items-center gap-2">
                          <CheckCircle size={18} />
                          Request sent to Owner
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={18} />
                          Request Account Deletion
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="text-yellow-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-[#030000] mb-2">🔒 Privacy Notice</h3>
                      <p className="text-gray-800 leading-relaxed">
                        We take your privacy seriously. All your data is encrypted and stored securely using industry-standard protocols. We never share your personal information with third parties without your explicit consent. Your data is yours.
                      </p>
                    </div>
                  </div>
                </div> */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h3 className="text-[#030000] text-center mb-2">Request Account Deletion?</h3>
            <p className="text-gray-600 text-center mb-6">
              Your deletion request will be sent to the Owner for review. You'll be notified once your request has been processed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
