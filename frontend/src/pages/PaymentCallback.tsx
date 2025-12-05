import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [bookingDetails, setBookingDetails] = useState<any>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            const reference = searchParams.get('reference');

            if (!reference) {
                setStatus('failed');
                toast({
                    title: 'Payment Verification Failed',
                    description: 'No payment reference found',
                    variant: 'destructive',
                });
                return;
            }

            try {
                // Verify payment with backend
                const verifyResponse = await bookingApi.verifyPayment(reference);

                if (verifyResponse.data.success) {
                    // Confirm booking and assign room
                    const confirmResponse = await bookingApi.confirm(verifyResponse.data.booking_id);

                    setBookingDetails({
                        bookingId: verifyResponse.data.booking_id,
                        amount: verifyResponse.data.amount,
                        roomNumber: confirmResponse.data.room_number,
                    });

                    setStatus('success');
                    toast({
                        title: 'Payment Successful!',
                        description: `Room ${confirmResponse.data.room_number} has been assigned`,
                    });
                } else {
                    setStatus('failed');
                }
            } catch (error: any) {
                console.error('Payment verification error:', error);
                setStatus('failed');
                toast({
                    title: 'Verification Failed',
                    description: error.response?.data?.detail || 'Unable to verify payment',
                    variant: 'destructive',
                });
            }
        };

        verifyPayment();
    }, [searchParams]);

    if (status === 'verifying') {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <Card className="p-8 text-center max-w-md">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h2>
                        <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
                    </Card>
                </div>
            </Layout>
        );
    }

    if (status === 'success') {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <Card className="p-8 text-center max-w-md">
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-300" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Booking Confirmed!</h2>
                        <p className="text-muted-foreground mb-6">
                            Your payment has been processed successfully.
                        </p>

                        {bookingDetails && (
                            <div className="bg-primary/10 rounded-lg p-4 mb-6 text-left">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Booking ID</span>
                                        <span className="font-semibold">#{bookingDetails.bookingId}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Room Number</span>
                                        <span className="font-semibold text-primary">{bookingDetails.roomNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Amount Paid</span>
                                        <span className="font-semibold">₦{bookingDetails.amount}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="gold"
                                size="lg"
                                onClick={() => navigate('/dashboard')}
                                className="w-full"
                            >
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/credentials')}
                                className="w-full"
                            >
                                View QR Code
                            </Button>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-600 dark:text-red-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Payment Failed</h2>
                    <p className="text-muted-foreground mb-6">
                        We couldn't verify your payment. Please try again or contact support.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="gold"
                            onClick={() => navigate('/booking')}
                            className="w-full"
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default PaymentCallback;
