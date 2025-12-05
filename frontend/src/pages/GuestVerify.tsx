import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, IdCard, Hotel, CheckCircle2, Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { bookingApi } from '@/services/api';

const API_URL = 'http://localhost:8000';

interface GuestData {
    user_id: number;
    name: string;
    unique_id: string;
    email: string;
    phone: string;
    access_level: string;
    has_active_booking: boolean;
    booking_id: number | null;
    booking_status: string | null;
    room_number: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    payment_status: string | null;
    amount: number | null;
    selfie_image: string | null;
}

const GuestVerify: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [guestData, setGuestData] = useState<GuestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (token) {
            verifyToken();
        }
    }, [token]);

    const verifyToken = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/access/verify-qr/${token}`);
            setGuestData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid or expired QR code');
            toast({
                title: 'Verification Failed',
                description: err.response?.data?.detail || 'Invalid or expired QR code',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!guestData?.booking_id) return;

        setIsProcessing(true);
        try {
            await bookingApi.checkIn(guestData.booking_id);
            toast({
                title: 'Checked In!',
                description: `${guestData.name} has been checked in successfully`,
            });
            // Refresh guest data
            verifyToken();
        } catch (error) {
            toast({
                title: 'Check-In Failed',
                description: 'Unable to check in guest',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckOut = async () => {
        if (!guestData?.booking_id) return;

        setIsProcessing(true);
        try {
            await bookingApi.checkOut(guestData.booking_id);
            toast({
                title: 'Checked Out!',
                description: `${guestData.name} has been checked out successfully`,
            });
            // Refresh guest data
            verifyToken();
        } catch (error) {
            toast({
                title: 'Check-Out Failed',
                description: 'Unable to check out guest',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMakePayment = async () => {
        if (!guestData?.booking_id) return;

        setIsProcessing(true);
        try {
            const paymentResponse = await bookingApi.initializePayment(guestData.booking_id);

            toast({
                title: 'Redirecting to Payment',
                description: 'Opening Paystack payment gateway...',
            });

            // Redirect to Paystack
            window.location.href = paymentResponse.data.authorization_url;
        } catch (error) {
            toast({
                title: 'Payment Initialization Failed',
                description: 'Unable to initialize payment',
                variant: 'destructive',
            });
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
                <Card className="p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Verifying guest...</p>
                </Card>
            </div>
        );
    }

    if (error || !guestData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-500/5 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">
                        The QR code may be invalid, expired, or has been tampered with.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 py-12">
            <div className="container mx-auto max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Hotel className="h-10 w-10 text-primary" />
                        <span className="font-display text-3xl font-semibold">
                            Luxe<span className="text-primary">Stay</span>
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Guest Verification</h1>
                    <p className="text-muted-foreground">QR Code Scanned Successfully</p>
                </div>

                {/* Guest Info Card */}
                <Card className="p-6 mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        {/* Guest Photo */}
                        <div className="flex-shrink-0">
                            {guestData.selfie_image ? (
                                <img
                                    src={guestData.selfie_image}
                                    alt={guestData.name}
                                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-10 w-10 text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Guest Name */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground">{guestData.name}</h2>
                            <p className="text-sm text-muted-foreground capitalize">{guestData.access_level} Guest</p>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${guestData.has_active_booking && guestData.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : guestData.has_active_booking
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                            {guestData.has_active_booking
                                ? (guestData.payment_status === 'paid' ? 'Paid & Confirmed' : 'Pending Payment')
                                : 'No Booking'}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                            <IdCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Unique ID</p>
                                <p className="font-semibold">{guestData.unique_id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-semibold">{guestData.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-semibold">{guestData.phone}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Booking Info Card */}
                {
                    guestData.has_active_booking && (
                        <Card className="p-6 mb-6 bg-gradient-to-br from-card to-primary/5">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Hotel className="h-5 w-5 text-primary" />
                                Current Booking
                            </h3>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <p className="font-semibold capitalize">{guestData.booking_status}</p>
                                        </div>
                                    </div>

                                    {guestData.room_number && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Room</p>
                                            <p className="text-2xl font-bold text-primary">{guestData.room_number}</p>
                                        </div>
                                    )}
                                </div>

                                {guestData.check_in_date && guestData.check_out_date && (
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Stay Period</p>
                                            <p className="font-semibold">
                                                {new Date(guestData.check_in_date).toLocaleDateString()} - {new Date(guestData.check_out_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )
                }

                {/* Action Buttons */}
                {
                    guestData.has_active_booking && (
                        <div className="grid gap-4">
                            {/* Pending - Need Payment */}
                            {guestData.booking_status === 'pending' && guestData.payment_status === 'unpaid' && (
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="w-full"
                                    onClick={handleMakePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Make Payment (₦{guestData.amount})
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Confirmed - Can Check In */}
                            {guestData.booking_status === 'confirmed' && guestData.payment_status === 'paid' && (
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={handleCheckIn}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="mr-2 h-5 w-5" />
                                            Check In Guest
                                        </>
                                    )}
                                </Button>
                            )}

                            {guestData.booking_status === 'checked_in' && (
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleCheckOut}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="mr-2 h-5 w-5" />
                                            Check Out Guest
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )
                }

                {/* No Booking Message */}
                {
                    !guestData.has_active_booking && (
                        <Card className="p-6 text-center bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                No Active Booking
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                This guest does not have an active booking. Please create a booking before checking in.
                            </p>
                        </Card>
                    )
                }
            </div >
        </div >
    );
};

export default GuestVerify;
