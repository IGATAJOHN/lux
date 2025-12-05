import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, roomApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Bed, Loader2, ArrowRight } from 'lucide-react';

interface RoomType {
  id: number;
  room_type: string;
  price_per_night: number;
  description?: string;
}

const Booking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    roomType: searchParams.get('type') || '',
    preferences: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomApi.list('available');
        const rooms: RoomType[] = response.data;

        // Filter to ensure only rooms with 'available' status
        const availableOnly = rooms.filter(room => room.status === 'available');

        // Deduplicate by room_type for the dropdown
        const uniqueTypes = Array.from(new Map(availableOnly.map(item => [item.room_type, item])).values());

        setAvailableRooms(uniqueTypes);

        // If no room type selected yet, select the first one
        if (!formData.roomType && uniqueTypes.length > 0) {
          setFormData(prev => ({ ...prev, roomType: uniqueTypes[0].room_type }));
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available rooms.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const selectedRoom = availableRooms.find(r => r.room_type === formData.roomType);

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const start = new Date(formData.checkIn);
      const end = new Date(formData.checkOut);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const nights = calculateNights();
  const totalPrice = nights * (selectedRoom?.price_per_night || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to make a booking.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (nights < 1) {
      toast({
        title: 'Invalid dates',
        description: 'Please select valid check-in and check-out dates.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create booking
      const bookingResponse = await bookingApi.create({
        check_in_date: new Date(formData.checkIn).toISOString(),
        check_out_date: new Date(formData.checkOut).toISOString(),
        room_type: formData.roomType,
        preferences: formData.preferences,
      });

      const bookingId = bookingResponse.data.id;

      // Step 2: Initialize Paystack payment
      toast({
        title: 'Redirecting to Payment',
        description: 'Opening Paystack payment gateway...',
      });

      const paymentResponse = await bookingApi.initializePayment(bookingId);

      // Redirect to Paystack payment page
      window.location.href = paymentResponse.data.authorization_url;

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Unable to complete booking. Please try again.';
      toast({
        title: 'Booking Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Book Your <span className="gradient-text">Stay</span>
            </h1>
            <p className="text-muted-foreground">
              Select your dates and preferences for an unforgettable experience.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn" className="text-foreground">Check-in Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="checkIn"
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                        className="pl-12"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOut" className="text-foreground">Check-out Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="checkOut"
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                        className="pl-12"
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType" className="text-foreground">Room Type</Label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                    disabled={isLoadingRooms}
                  >
                    <SelectTrigger className="h-11 bg-input border-border">
                      <Bed className="h-5 w-5 text-muted-foreground mr-2" />
                      <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room type"} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.room_type}>
                          {room.room_type} - ₦{room.price_per_night}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableRooms.length === 0 && !isLoadingRooms && (
                    <p className="text-sm text-destructive mt-1">No rooms available at the moment.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferences" className="text-foreground">Special Requests (Optional)</Label>
                  <div className="relative">
                    <Textarea
                      id="preferences"
                      placeholder="Any special requests or preferences..."
                      value={formData.preferences}
                      onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                      className="min-h-[120px] bg-input border-border"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || isLoadingRooms || availableRooms.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Summary */}
            <div>
              <div className="glass-card p-6 sticky top-24">
                <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                  Booking Summary
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Room Type</span>
                    <span className="text-foreground font-medium">{selectedRoom?.room_type || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per Night</span>
                    <span className="text-foreground font-medium">₦{selectedRoom?.price_per_night || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Number of Nights</span>
                    <span className="text-foreground font-medium">{nights}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-foreground font-semibold">Total</span>
                      <span className="text-2xl font-display font-bold gradient-text">
                        ₦{totalPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Secure payment with Paystack. Free cancellation up to 24 hours before check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Booking;
