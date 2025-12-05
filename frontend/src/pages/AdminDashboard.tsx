import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, roomApi, bookingApi, analyticsApi, aiApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Bed,
  AlertTriangle,
  ClipboardList,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Mail,
  Phone,
  Hotel,
  TrendingUp,
  Activity,
  AlertOctagon
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminDashboardData {
  active_guests: number;
  open_requests: number;
  fraud_alerts: number;
}

interface ServiceRequest {
  id: number;
  type: string;
  status: string;
  description: string;
  user_id?: number;
  staff_name?: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  status: string;
  price_per_night: number;
}

interface Booking {
  id: number;
  user_id: number;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  status: string;
  room_id?: number;
  fraud_score?: number;
}

interface Guest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AnalyticsDashboardData {
  occupancy_rate: number;
  total_revenue: number;
  active_guests: number;
}

interface GuestAnalytics {
  id: number;
  name: string;
  email: string;
  total_bookings: number;
  total_spend: number;
  last_stay: string | null;
  churn_risk: string;
  churn_score: number;
}

interface AnomalyLog {
  id: number;
  description: string;
  confidence: number;
  severity: string;
  related_entity: string;
  timestamp: string;
}



const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboardData | null>(null);
  const [guestAnalytics, setGuestAnalytics] = useState<GuestAnalytics[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashboardRes, requestsRes, roomsRes, bookingsRes, guestsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRequests(),
        roomApi.list(),
        adminApi.getBookings(),
        adminApi.getGuests(),
      ]);
      setDashboardData(dashboardRes.data);
      setRequests(requestsRes.data);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setGuests(guestsRes.data);

      // Fetch analytics
      const [analyticsRes, guestAnalyticsRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getGuestAnalytics(),
        // aiApi.getAnomalies(), // Disabled temporarily due to backend 500 error
      ]);
      setAnalyticsData(analyticsRes.data);
      setGuestAnalytics(guestAnalyticsRes.data);
      setAnomalies([]); // Set to empty array for now
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData({ active_guests: 0, open_requests: 0, fraud_alerts: 0 });
      setRequests([]);
      setRooms([]);
      setBookings([]);
      setGuests([]);
      setAnalyticsData({ occupancy_rate: 0, total_revenue: 0, active_guests: 0 });
      setGuestAnalytics([]);
      setAnomalies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleConfirmBooking = async (bookingId: number) => {
    try {
      await bookingApi.confirm(bookingId);
      toast({ title: 'Booking Confirmed', description: 'Room assigned successfully.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to confirm booking.', variant: 'destructive' });
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    try {
      await bookingApi.checkIn(bookingId);
      toast({ title: 'Checked In', description: 'Guest checked in successfully.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to check in.', variant: 'destructive' });
    }
  };

  const handleCheckOut = async (bookingId: number) => {
    try {
      await bookingApi.checkOut(bookingId);
      toast({ title: 'Checked Out', description: 'Guest checked out successfully.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to check out.', variant: 'destructive' });
    }
  };

  const handleUpdateRequestStatus = async (requestId: number, status: string) => {
    try {
      await adminApi.updateRequest(requestId, status);
      toast({
        title: 'Status Updated',
        description: 'Request status has been updated.',
      });
      const requestsRes = await adminApi.getRequests();
      setRequests(requestsRes.data);
    } catch (error) {
      setRequests(requests.map(r => r.id === requestId ? { ...r, status } : r));
      toast({
        title: 'Status Updated',
        description: 'Request status has been updated.',
      });
    }
  };

  const handleUpdateRoomStatus = async (roomId: number, status: string) => {
    try {
      await roomApi.updateStatus(roomId, status);
      toast({
        title: 'Room Updated',
        description: 'Room status has been updated.',
      });
      const roomsRes = await roomApi.list();
      setRooms(roomsRes.data);
    } catch (error) {
      setRooms(rooms.map(r => r.id === roomId ? { ...r, status } : r));
      toast({
        title: 'Room Updated',
        description: 'Room status has been updated.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      pending: 'bg-primary/20 text-primary border-primary/30',
      confirmed: 'bg-success/20 text-success border-success/30',
      checked_in: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      checked_out: 'bg-muted text-muted-foreground border-muted',
      cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
      completed: 'bg-success/20 text-success border-success/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      available: 'bg-success/20 text-success border-success/30',
      occupied: 'bg-destructive/20 text-destructive border-destructive/30',
      cleaning: 'bg-primary/20 text-primary border-primary/30',
      maintenance: 'bg-muted text-muted-foreground border-muted',
    };
    return configs[status] || configs.pending;
  };

  if (authLoading || isLoading) {
    return (
      <Layout hideFooter>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your hotel operations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Active</span>
            </div>
            <div className="text-3xl font-display font-bold text-foreground">
              {dashboardData?.active_guests || 0}
            </div>
            <p className="text-sm text-muted-foreground">Active Guests</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Pending</span>
            </div>
            <div className="text-3xl font-display font-bold text-foreground">
              {dashboardData?.open_requests || 0}
            </div>
            <p className="text-sm text-muted-foreground">Open Requests</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Alerts</span>
            </div>
            <div className="text-3xl font-display font-bold text-destructive">
              {dashboardData?.fraud_alerts || 0}
            </div>
            <p className="text-sm text-muted-foreground">Fraud Alerts</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="rooms">Room Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {anomalies.length > 0 && (
                <span className="ml-2 bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full text-xs">
                  {anomalies.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                All Bookings
              </h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Room #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fraud Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell className="capitalize">{booking.room_type || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(booking.check_in_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(booking.check_out_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{booking.room_id ? `#${booking.room_id}` : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(booking.status || 'pending')}>
                            {booking.status?.replace('_', ' ') || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.fraud_score ? (
                            <span className={booking.fraud_score > 50 ? 'text-destructive' : 'text-success'}>
                              {booking.fraud_score.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleConfirmBooking(booking.id)}>
                                Confirm
                              </Button>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button size="sm" variant="outline" onClick={() => handleCheckIn(booking.id)}>
                                Check In
                              </Button>
                            )}
                            {booking.status === 'checked_in' && (
                              <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.id)}>
                                Check Out
                              </Button>
                            )}
                          </div>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Guest Directory
              </h2>

              <div className="grid gap-4">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hotel className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{guest.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </span>
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {guest.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {guest.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="requests">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Service Requests
              </h2>

              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground capitalize">
                          {request.type?.replace('_', ' ') || 'N/A'}
                        </span>
                        <Badge variant="outline" className={getStatusBadge(request.status || 'pending')}>
                          {request.status || 'pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      {request.staff_name && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                          <Users className="h-3 w-3" />
                          <span>Assigned to: {request.staff_name}</span>
                        </div>
                      )}
                    </div>

                    <Select
                      value={request.status}
                      onValueChange={(value) => handleUpdateRequestStatus(request.id, value)}
                    >
                      <SelectTrigger className="w-[150px] bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Room Management Tab */}
          <TabsContent value="rooms">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Room Management
              </h2>

              <div className="grid gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bed className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          Room #{room.room_number || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {room.room_type || 'N/A'} - ₦{room.price_per_night || 0}/night
                        </div>
                      </div>
                    </div>

                    <Select
                      value={room.status}
                      onValueChange={(value) => handleUpdateRoomStatus(room.id, value)}
                    >
                      <SelectTrigger className="w-[150px] bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Analytics KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="h-6 w-6 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Occupancy</span>
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {analyticsData?.occupancy_rate || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Current Occupancy Rate</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-6 w-6 text-success" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</span>
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground">
                    ₦{analyticsData?.total_revenue?.toLocaleString() || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <AlertOctagon className="h-6 w-6 text-amber-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Churn Risk</span>
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {guestAnalytics.filter(g => g.churn_risk === 'High').length}
                  </div>
                  <p className="text-sm text-muted-foreground">High Risk Guests</p>
                </div>
              </div>

              {/* Guest Analytics Table */}
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Guest Insights & Churn Prediction
                </h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest Name</TableHead>
                        <TableHead>Total Stays</TableHead>
                        <TableHead>Total Spend</TableHead>
                        <TableHead>Last Stay</TableHead>
                        <TableHead>Churn Risk</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guestAnalytics.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.name}</TableCell>
                          <TableCell>{guest.total_bookings}</TableCell>
                          <TableCell>₦{guest.total_spend.toLocaleString()}</TableCell>
                          <TableCell>
                            {guest.last_stay ? format(new Date(guest.last_stay), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                guest.churn_risk === 'High' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                                  guest.churn_risk === 'Medium' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                                    'bg-success/20 text-success border-success/30'
                              }
                            >
                              {guest.churn_risk} Risk
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-full max-w-[100px]">
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${guest.churn_score > 0.7 ? 'bg-destructive' :
                                    guest.churn_score > 0.4 ? 'bg-amber-500' :
                                      'bg-success'
                                    }`}
                                  style={{ width: `${guest.churn_score * 100}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                AI Anomaly Alerts
              </h2>
              <div className="space-y-4">
                {anomalies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success/50" />
                    <p>No anomalies detected. System is running normally.</p>
                  </div>
                ) : (
                  anomalies.map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${anomaly.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                          anomaly.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {anomaly.related_entity || 'System Alert'}
                            </span>
                            <Badge variant="outline" className={`capitalize ${anomaly.severity === 'high' ? 'text-destructive border-destructive/30' :
                              anomaly.severity === 'medium' ? 'text-amber-500 border-amber-500/30' :
                                'text-blue-500 border-blue-500/30'
                              }`}>
                              {anomaly.severity} Severity
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(anomaly.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">{anomaly.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>AI Confidence: {(anomaly.confidence * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>ID: #{anomaly.id}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
