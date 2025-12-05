import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Bed,
  MessageSquare,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const roomTypes = [
  { value: 'single', label: 'Single Room', price: 150 },
  { value: 'double', label: 'Double Room', price: 250 },
  { value: 'suite', label: 'Suite', price: 450 },
  { value: 'deluxe', label: 'Deluxe Room', price: 650 },
  { value: 'presidential', label: 'Presidential Suite', price: 1200 },
];

const Booking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    roomType: searchParams.get('type') || 'double',
    preferences: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedRoom = roomTypes.find(r => r.value === formData.roomType);

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
  const totalPrice = nights * (selectedRoom?.price || 0);

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
          </h1 >
  <p className="text-muted-foreground">
    Select your dates and preferences for an unforgettable experience.
  </p>
        </div >

  <div className="grid lg:grid-cols-3 gap-8">
    {/* Booking Form */}
