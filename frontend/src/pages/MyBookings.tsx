import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  Calendar,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  LogIn,
  LogOut as LogOutIcon
} from 'lucide-react';
import { format } from 'date-fns';

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

const statusConfig: Record<string, { color: string; icon: React.ComponentType<any> }> = {
  pending: { color: 'bg-primary/20 text-primary border-primary/30', icon: Clock },
  confirmed: { color: 'bg-success/20 text-success border-success/30', icon: CheckCircle },
  checked_in: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: LogIn },
  checked_out: { color: 'bg-muted text-muted-foreground border-muted', icon: LogOutIcon },
  cancelled: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle },
};

// Demo bookings
const demoBookings: Booking[] = [
  {
    id: 1,
    user_id: 1,
    check_in_date: '2024-01-15T14:00:00',
    check_out_date: '2024-01-20T11:00:00',
    room_type: 'suite',
    status: 'confirmed',
    room_id: 301,
  },
  {
    id: 2,
    user_id: 1,
    check_in_date: '2024-02-10T14:00:00',
    check_out_date: '2024-02-14T11:00:00',
    room_type: 'deluxe',
    status: 'pending',
  },
];

const MyBookings: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await bookingApi.list();
        setBookings(response.data);
      } catch (error) {
        setBookings(demoBookings);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading, navigate]);



  const handleCheckOut = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await bookingApi.checkOut(bookingId);
      toast({
        title: 'Checked Out',
        description: 'Thank you for staying with us!',
      });
      // Refresh bookings
      const response = await bookingApi.list();
      setBookings(response.data);
    } catch (error) {
      toast({
        title: 'Check-out Failed',
        description: 'Unable to check out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              My <span className="gradient-text">Bookings</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your reservations
            </p>
          </div>
          <Button variant="gold" asChild>
            <Link to="/booking">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking, index) => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={booking.id}
                  className="glass-card p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-display text-xl font-semibold text-foreground capitalize">
                          {booking.room_type} Room
                        </h3>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Check-in</span>
                          <span className="text-foreground font-medium">
                            {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Check-out</span>
                          <span className="text-foreground font-medium">
                            {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {booking.room_id && (
                          <div>
                            <span className="text-muted-foreground block">Room Number</span>
                            <span className="text-foreground font-medium">#{booking.room_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => navigate(`/face-verification?bookingId=${booking.id}`)}
                        >
                          <LogIn className="h-4 w-4" />
                          Biometric Check-In
                        </Button>
                      )}
                      {booking.status === 'checked_in' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(booking.id)}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogOutIcon className="h-4 w-4" />
                              Check Out
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No Bookings Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              You haven't made any reservations yet. Start planning your perfect getaway!
            </p>
            <Button variant="gold" asChild>
              <Link to="/booking">
                <Plus className="h-4 w-4" />
                Book Your Stay
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBookings;
