import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { Plus, Edit, Trash2, Search, Shield, Users, RefreshCw } from 'lucide-react';
import { User } from '@/types/dashboard.types';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/store/slices/adminUsers.slice';
import { privateApiCall, privateApiPost } from '@/lib/api';

interface UsersTableProps {
  users: User[];
  setUsers: (users: User[]) => void;
}

export function UsersTable({ users, setUsers }: UsersTableProps) {
  const dispatch = useAppDispatch();
  const { users: adminUsers, isLoading, isCreating, isUpdating, isDeleting, error } = useAppSelector((state) => state.adminUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null as User | null);
  const [userToDelete, setUserToDelete] = useState(null as User | null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin' as 'superadmin' | 'admin',
    isActive: true as boolean
  });
  const [syncLimits, setSyncLimits] = useState([] as any[]);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [editingLimit, setEditingLimit] = useState(null as { userId: string; userName: string; monthlyLimit: number } | null);

  // Fetch users on component mount only if no cached data exists
  useEffect(() => {
    // Only fetch if we don't have cached data
    if (adminUsers.length === 0) {
      dispatch(getAdminUsers({ page: 1, limit: 25 }));
    }
  }, [dispatch, adminUsers.length]);

  // Fetch sync limits
  useEffect(() => {
    const fetchSyncLimits = async () => {
      try {
        setIsLoadingLimits(true);
        const response = await privateApiCall<{ limits: any[] }>('/admin/sync-limits');
        setSyncLimits(response.limits || []);
      } catch (error: any) {
        console.error('Failed to fetch sync limits:', error);
      } finally {
        setIsLoadingLimits(false);
      }
    };
    fetchSyncLimits();
  }, []);

  const getSyncLimitForUser = (userId: string) => {
    return syncLimits.find((limit: any) => limit.userId === userId) || {
      monthlyLimit: 0,
      currentMonthCount: 0,
      remainingSyncs: 0
    };
  };

  const handleSetSyncLimit = async (userId: string, monthlyLimit: number) => {
    try {
      await privateApiPost('/admin/sync-limits', { userId, monthlyLimit });
      toast.success('Sync limit updated successfully');
      // Refresh sync limits
      const response = await privateApiCall<{ limits: any[] }>('/admin/sync-limits');
      setSyncLimits(response.limits || []);
      setEditingLimit(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update sync limit');
    }
  };

  // Update local users when Redux state changes
  useEffect(() => {
    if (adminUsers && adminUsers.length > 0) {
      setUsers(adminUsers);
    }
  }, [adminUsers, setUsers]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const filteredUsers = ((adminUsers && adminUsers.length > 0) ? adminUsers : users).filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await dispatch(createAdminUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: 'admin' // Always set to admin
      })).unwrap();

      toast.success('User added successfully');
      setNewUser({
        email: '',
        name: '',
        password: '',
        role: 'admin',
        isActive: true
      });
      setIsAddDialogOpen(false);

      // Refresh the users list
      dispatch(getAdminUsers({ page: 1, limit: 25 }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      name: user.name,
      role: 'admin', // Always set to admin, cannot be changed
      isActive: (user as any).isActive !== undefined ? (user as any).isActive : true
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!newUser.name) {
      toast.error('Name is required');
      return;
    }

    try {
      await dispatch(updateAdminUser({
        id: editingUser.id,
        name: newUser.name,
        isActive: newUser.isActive,
        // Email and role are not editable, so we don't send them
      })).unwrap();

      toast.success('User updated successfully');
      setEditingUser(null);
      setNewUser({
        email: '',
        name: '',
        password: '',
        role: 'admin',
        isActive: true
      });
      // The slice already updates the user in state, no need to refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await dispatch(deleteAdminUser({ id: userToDelete.id })).unwrap();
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      // The slice already removes the user from state, no need to refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Companies ({filteredUsers.length})</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" style={{ backgroundColor: '#2563EB' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>Fill in the company details below to add a new company to the system.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e: any) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="company@domain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e: any) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <PasswordInput
                      id="password"
                      value={newUser.password}
                      onChange={(e: any) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter password (min 8 characters)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value="admin" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} style={{ backgroundColor: '#2563EB' }} disabled={isCreating}>
                    {isCreating ? 'Adding...' : 'Add Company'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sync Limit</TableHead>
                    <TableHead>Sync Count</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sync Limit</TableHead>
                    <TableHead>Sync Count</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const syncLimit = getSyncLimitForUser(user.id);
                      const remainingSyncs = Math.max(0, syncLimit.monthlyLimit - syncLimit.currentMonthCount);
                      
                      return (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'superadmin' ? 'default' : 'secondary'}
                            className="flex items-center space-x-1 w-fit"
                          >
                            {user.role === 'superadmin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            <span>{user.role === 'superadmin' ? 'Owner' : 'Admin'}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={(user as any).isActive === false
                              ? "text-red-600 border-red-200"
                              : "text-green-600 border-green-200"
                            }
                          >
                            {(user as any).isActive === false ? 'Inactive' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'superadmin' ? (
                            <span className="text-gray-400">Unlimited</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{syncLimit.monthlyLimit || 0}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLimit({ userId: user.id, userName: user.name, monthlyLimit: syncLimit.monthlyLimit || 0 })}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.role === 'superadmin' ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <span className={syncLimit.currentMonthCount >= syncLimit.monthlyLimit ? 'text-red-600 font-medium' : ''}>
                              {syncLimit.currentMonthCount || 0}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.role === 'superadmin' ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <span className={remainingSyncs === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                              {remainingSyncs}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Dialog open={editingUser?.id === user.id} onOpenChange={(open: boolean) => {
                              if (!open) {
                                setEditingUser(null);
                                setNewUser({
                                  email: '',
                                  name: '',
                                  password: '',
                                  role: 'admin',
                                  isActive: true
                                });
                              }
                            }}>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>Update the user information below.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      value={newUser.email}
                                      disabled
                                      className="bg-gray-100 cursor-not-allowed"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Name *</Label>
                                    <Input
                                      id="edit-name"
                                      value={newUser.name}
                                      onChange={(e: any) => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value="admin" disabled>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                      value={newUser.isActive ? 'true' : 'false'}
                                      onValueChange={(value: string) => setNewUser({ ...newUser, isActive: value === 'true' })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-6">
                                  <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isUpdating}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateUser} style={{ backgroundColor: '#2563EB' }} disabled={isUpdating}>
                                    {isUpdating ? 'Updating...' : 'Update User'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 hover:text-red-700"
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Sync Limit Edit Dialog */}
          <Dialog open={editingLimit !== null} onOpenChange={(open: boolean) => {
            if (!open) setEditingLimit(null);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Sync Limit</DialogTitle>
                <DialogDescription>
                  Set monthly LinkedIn sync limit for {editingLimit?.userName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-limit">Monthly Sync Limit</Label>
                  <Input
                    id="sync-limit"
                    type="number"
                    min="0"
                    value={editingLimit?.monthlyLimit || 0}
                    onChange={(e: any) => {
                      if (editingLimit) {
                        setEditingLimit({
                          ...editingLimit,
                          monthlyLimit: parseInt(e.target.value) || 0
                        });
                      }
                    }}
                    placeholder="Enter monthly limit (e.g., 10)"
                  />
                  <p className="text-xs text-gray-500">
                    Set to 0 to disable syncing for this user
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingLimit(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingLimit) {
                        handleSetSyncLimit(editingLimit.userId, editingLimit.monthlyLimit);
                      }
                    }}
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => {
              setIsDeleteDialogOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}