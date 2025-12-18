import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { CheckCircle2, XCircle, Clock, User, Mail, Building, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ApprovalRequest } from '@/types/dashboard.types';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getApproveRequests, blockCustomer, unblockCustomer } from '@/store/slices/approveRequests.slice';

interface ApprovalRequestsProps {
  approvalRequests?: ApprovalRequest[];
  setApprovalRequests?: (requests: ApprovalRequest[]) => void;
  currentUser: { name: string; role: string };
  onApprove?: (request: ApprovalRequest) => void;
}

export function ApprovalRequests({ 
  approvalRequests: propApprovalRequests, 
  setApprovalRequests: propSetApprovalRequests, 
  currentUser,
  onApprove 
}: ApprovalRequestsProps) {
  const dispatch = useAppDispatch();
  const { requests, pagination, stats, isLoading, isApproving, isRejecting, error, lastFetchParams } = useAppSelector((state) => state.approveRequests);
  
  // Always prioritize Redux state to ensure optimistic updates are reflected immediately
  // Redux state is the source of truth for real-time updates
  const approvalRequests = requests.length > 0 ? requests : (propApprovalRequests || []);
  
  // Sync props with Redux state for backward compatibility (only if props are being used)
  useEffect(() => {
    if (requests.length > 0 && propSetApprovalRequests) {
      propSetApprovalRequests(requests);
    }
  }, [requests, propSetApprovalRequests]);
  
  const [selectedRequest, setSelectedRequest] = useState(null as ApprovalRequest | null);
  const [actionType, setActionType] = useState(null as 'block' | 'unblock' | null);
  const [blockedReason, setBlockedReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);

  // Helper function to check if params match
  const paramsMatch = (params1: { page?: number; limit?: number } | null, params2: { page?: number; limit?: number }): boolean => {
    if (!params1) return false;
    return params1.page === params2.page && params1.limit === params2.limit;
  };

  // Fetch approve requests on component mount and when page/limit changes
  useEffect(() => {
    const currentParams = { page: currentPage, limit: pageLimit };
    
    // Check if we need to fetch:
    // 1. No data exists AND we've never fetched before (requests.length === 0 && lastFetchParams === null)
    // 2. Params changed (page or limit changed)
    // Note: We check requests.length inside the effect but don't include it in deps to prevent loops
    const shouldFetch = 
      (requests.length === 0 && lastFetchParams === null) || 
      !paramsMatch(lastFetchParams, currentParams);

    if (shouldFetch) {
      dispatch(getApproveRequests(currentParams));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, currentPage, pageLimit, lastFetchParams]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleBlock = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setActionType('block');
    setBlockedReason('');
  };

  const handleUnblock = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setActionType('unblock');
    setBlockedReason('');
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    // Get customerId from request (it might be in id field or customerId field)
    const customerId = (selectedRequest as any).customerId 
      || (selectedRequest as any)._id 
      || selectedRequest.id
      || (selectedRequest as any).id;

    // Validate customerId exists
    if (!customerId || (typeof customerId === 'string' && customerId.trim() === '')) {
      console.error('Customer ID missing in request:', selectedRequest);
      toast.error('Customer ID is missing. Please refresh the page and try again.');
      return;
    }

    // Convert to string and trim
    const customerIdString = String(customerId).trim();

    if (actionType === 'block') {
      // Block action - blocked reason is mandatory
      if (!blockedReason.trim()) {
        toast.error('Block reason is required');
        return;
      }

      try {
        // Close dialog immediately for better UX
        setSelectedRequest(null);
        setActionType(null);
        setBlockedReason('');
        
        // Dispatch block action - UI updates optimistically
        await dispatch(blockCustomer({ 
          customerId: customerIdString, 
          blockedReason: blockedReason.trim(),
          reviewedBy: currentUser.name
        })).unwrap();
        toast.success(`Customer blocked: ${selectedRequest.firstName} ${selectedRequest.lastName}`);
        // Refetch latest data from API to get server response (including reviewedBy if API returns it)
        // Use background flag to avoid showing loading state since we already have optimistic update
        dispatch(getApproveRequests({ page: currentPage, limit: pageLimit, background: true }));
      } catch (error: any) {
        toast.error(error.message || 'Failed to block customer');
        // On error, refetch to restore correct state (rollback already handled in slice)
        dispatch(getApproveRequests({ page: currentPage, limit: pageLimit }));
      }
    } else if (actionType === 'unblock') {
      try {
        // Close dialog immediately for better UX
        setSelectedRequest(null);
        setActionType(null);
        setBlockedReason('');
        
        // Dispatch unblock action - UI updates optimistically
        await dispatch(unblockCustomer({ 
          customerId: customerIdString,
          reviewedBy: currentUser.name
        })).unwrap();
        toast.success(`Customer unblocked: ${selectedRequest.firstName} ${selectedRequest.lastName}`);
        // Refetch latest data from API to get server response (including reviewedBy if API returns it)
        // Use background flag to avoid showing loading state since we already have optimistic update
        dispatch(getApproveRequests({ page: currentPage, limit: pageLimit, background: true }));
      } catch (error: any) {
        toast.error(error.message || 'Failed to unblock customer');
        // On error, refetch to restore correct state (rollback already handled in slice)
        dispatch(getApproveRequests({ page: currentPage, limit: pageLimit }));
      }
    }
  };

  // Use pagination from API or default values for display
  const displayPage = pagination?.currentPage || currentPage;
  const rowsPerPage = pagination?.limit || pageLimit;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;

  const handlePageNavigation = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    const limit = parseInt(value, 10);
    setPageLimit(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const getStatusBadge = (request: ApprovalRequest) => {
    if (request.isBlocked) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 transition-all duration-300 ease-in-out">
          <XCircle className="w-3 h-3 mr-1" />
          Blocked
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 transition-all duration-300 ease-in-out">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 transition-all duration-300 ease-in-out">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Blocked Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 transition-all duration-300 ease-in-out">{stats.blockedCustomers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Table */}
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Customer Registration Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20 rounded" />
                          <Skeleton className="h-8 w-20 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : approvalRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No registration requests found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalRequests.map((request) => (
                    <TableRow key={request.id} className="transition-all duration-300 ease-in-out">
                      <TableCell className="font-medium">
                        {request.firstName} {request.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {request.businessEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {request.companyName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(request.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="transition-all duration-300 ease-in-out">
                          {getStatusBadge(request)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.reviewedBy ? (
                          <div>
                            <div className="text-sm">{request.reviewedBy}</div>
                            {request.reviewedAt && (
                              <div className="text-xs text-gray-500">
                                {formatDate(request.reviewedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="transition-all duration-300 ease-in-out">
                          {!request.isBlocked ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBlock(request)}
                              disabled={isRejecting || isApproving}
                              className="transition-all duration-300 ease-in-out"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Block
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleUnblock(request)}
                              className="bg-green-600 hover:bg-green-700 transition-all duration-300 ease-in-out"
                              disabled={isApproving || isRejecting}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Unblock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls - Fixed at bottom */}
          {pagination && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Label>Rows per page:</Label>
                <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalCount)} of {totalCount} results
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageNavigation(Math.max(displayPage - 1, 1))}
                  disabled={!pagination?.hasPreviousPage || displayPage === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={displayPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageNavigation(pageNum)}
                        style={displayPage === pageNum ? { backgroundColor: '#EF8037' } : {}}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageNavigation(Math.min(displayPage + 1, totalPages))}
                  disabled={!pagination?.hasNextPage || displayPage === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block/Unblock Dialog */}
      <Dialog open={selectedRequest !== null && actionType !== null} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setBlockedReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'block' ? 'Block Customer' : 'Unblock Customer'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {actionType === 'block' 
                    ? `Are you sure you want to block ${selectedRequest.firstName} ${selectedRequest.lastName}?`
                    : `Are you sure you want to unblock ${selectedRequest.firstName} ${selectedRequest.lastName}?`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{selectedRequest.firstName} {selectedRequest.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedRequest.businessEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedRequest.companyName}</span>
                </div>
              </div>
              
              {actionType === 'block' && (
                <div className="space-y-2">
                  <Label htmlFor="blocked-reason" className="text-sm font-medium">
                    Block Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="blocked-reason"
                    placeholder="Provide a reason for blocking..."
                    value={blockedReason}
                    onChange={(e: { target: { value: string } }) => setBlockedReason(e.target.value)}
                    rows={3}
                    required
                    className={!blockedReason.trim() ? 'border-red-300' : ''}
                  />
                  {!blockedReason.trim() && (
                    <p className="text-xs text-red-500">Block reason is required</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionType(null);
                    setBlockedReason('');
                  }}
                  disabled={isApproving || isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  disabled={isApproving || isRejecting || (actionType === 'block' && !blockedReason.trim())}
                  className={actionType === 'block' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                  }
                >
                  {isApproving || isRejecting ? (
                    'Processing...'
                  ) : actionType === 'block' ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Block
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Unblock
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

