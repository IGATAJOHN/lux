import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { guestApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bed,
  Bell,
  Calendar,
  ClipboardList,
  Sparkles,
  Loader2,
  Plus,
  Coffee,
  Wrench,
  Utensils,
  Shirt,
  HelpCircle,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface DashboardData {
  booking_status: string;
  current_room: string;
  active_requests: number;
  recommendations: string[];
}

interface ServiceRequest {
  id: number;
  type: string;
  status: string;
  description: string;
}

const requestTypes = [
  { value: 'room_service', label: 'Room Service', icon: Coffee },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'dining', label: 'Dining Reservation', icon: Utensils },
  { value: 'laundry', label: 'Laundry Service', icon: Shirt },
  { value: 'other', label: 'Other', icon: HelpCircle },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-primary" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ type: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [dashboardRes, requestsRes] = await Promise.all([
          guestApi.getDashboard(),
          guestApi.getRequests(),
        ]);
        setDashboardData(dashboardRes.data);
        setRequests(requestsRes.data);
      } catch (error) {
        // Use demo data if API fails
        setDashboardData({
          booking_status: 'Checked-in',
          current_room: '301',
          active_requests: 2,
          recommendations: [
            'Try our rooftop restaurant for dinner',
            'Book a spa session for relaxation',
            'Visit the fitness center',
          ],
        });
        setRequests([
          { id: 1, type: 'room_service', status: 'pending', description: 'Extra towels needed' },
          { id: 2, type: 'maintenance', status: 'completed', description: 'AC temperature adjustment' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleNewRequest = async () => {
    if (!newRequest.type || !newRequest.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await guestApi.createServiceRequest(newRequest.type, newRequest.description);
      toast({
        title: 'Request Submitted',
        description: 'Your service request has been received.',
      });
      setIsDialogOpen(false);
      setNewRequest({ type: '', description: '' });
      // Refresh requests
      const requestsRes = await guestApi.getRequests();
      setRequests(requestsRes.data);
    } catch (error) {
      toast({
        title: 'Request Failed',
        description: 'Unable to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your stay
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Bed className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Room</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">
              #{dashboardData?.current_room || '---'}
            </div>
            <p className="text-sm text-muted-foreground">{dashboardData?.booking_status}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Requests</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">
              {dashboardData?.active_requests || 0}
            </div>
            <p className="text-sm text-muted-foreground">Active requests</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Bookings</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">
              1
            </div>
            <p className="text-sm text-muted-foreground">Current booking</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Bell className="h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Updates</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">
              3
            </div>
            <p className="text-sm text-muted-foreground">New notifications</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Service Requests */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Service Requests
                </h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gold" size="sm">
                      <Plus className="h-4 w-4" />
                      New Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display">New Service Request</DialogTitle>
                      <DialogDescription>
                        What can we help you with?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Select
                        value={newRequest.type}
                        onValueChange={(value) => setNewRequest({ ...newRequest, type: value })}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {requestTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Describe your request..."
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                        className="min-h-[100px] bg-input border-border"
                      />
                      <Button
                        variant="gold"
                        className="w-full"
                        onClick={handleNewRequest}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const typeInfo = requestTypes.find(t => t.value === request.type);
                    return (
                      <div
                        key={request.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {typeInfo && <typeInfo.icon className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {typeInfo?.label || request.type}
                            </span>
                            <span className="flex items-center gap-1 text-xs capitalize">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No service requests yet</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold text-foreground">
                  For You
                </h2>
              </div>
              <div className="space-y-4">
                {dashboardData?.recommendations?.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 mt-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/my-bookings">My Bookings</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/rooms">Browse Rooms</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
