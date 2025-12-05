import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2, Scan } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CameraCapture from '@/components/CameraCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi, bookingApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type VerificationStep = 'id-input' | 'camera' | 'verifying' | 'success' | 'failed';

const FaceVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<VerificationStep>('id-input');
  const [uniqueId, setUniqueId] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    match: boolean;
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueId.trim()) return;

    setIsLoading(true);
    try {
      await authApi.verifyId(uniqueId);
      setStep('camera');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.detail || 'ID not found in system',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceCapture = async (imageBase64: string) => {
    setStep('verifying');
    try {
      const response = await authApi.faceMatch(uniqueId, imageBase64);
      setVerificationResult(response.data);

      if (response.data.match) {
        setStep('success');
        if (bookingId) {
          await bookingApi.checkIn(parseInt(bookingId));
          toast({
            title: 'Check-in Successful',
            description: 'You have been checked in successfully!',
          });
        }
      } else {
        setStep('failed');
      }
    } catch (error: any) {
      setStep('failed');
      toast({
        title: 'Verification Error',
        description: error.response?.data?.detail || 'Face verification failed',
        variant: 'destructive',
      });
    }
  };

  const resetVerification = () => {
    setStep('id-input');
    setUniqueId('');
    setVerificationResult(null);
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Biometric Verification</h1>
            <p className="text-muted-foreground">
              {bookingId ? 'Verify your identity to check in' : 'Secure face verification'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['ID', 'Capture', 'Verify'].map((label, idx) => {
              const stepIndex = ['id-input', 'camera', 'verifying'].indexOf(step);
              const isActive = idx <= stepIndex || step === 'success' || step === 'failed';
              return (
                <React.Fragment key={label}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 2 && (
                    <div className={`w-12 h-0.5 ${isActive ? 'bg-primary' : 'bg-secondary'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Content Card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            {step === 'id-input' && (
              <form onSubmit={handleIdSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <Scan className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-semibold mb-1">Enter Your ID</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your passport or ID number to begin verification
                  </p>
                </div>
                <Input
                  type="text"
                  placeholder="Passport / ID Number"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  className="text-center text-lg tracking-wider"
                />
                <Button type="submit" className="w-full" disabled={!uniqueId.trim() || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying ID...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            )}

            {step === 'camera' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold mb-1">Face Capture</h2>
                  <p className="text-sm text-muted-foreground">
                    Look directly at the camera for verification
                  </p>
                </div>
                <CameraCapture onCapture={handleFaceCapture} />
              </div>
            )}

            {step === 'verifying' && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Verifying Your Identity</h2>
                <p className="text-muted-foreground">
                  Please wait while we match your face...
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-green-500">Verified!</h2>
                <p className="text-muted-foreground mb-2">
                  Identity confirmed with {((verificationResult?.confidence || 0) * 100).toFixed(0)}% confidence
                </p>
                {bookingId && (
                  <p className="text-sm text-primary mb-6">You are now checked in</p>
                )}
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}

            {step === 'failed' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-destructive">Verification Failed</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't verify your identity. Please try again.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetVerification} className="flex-1">
                    Start Over
                  </Button>
                  <Button onClick={() => setStep('camera')} className="flex-1">
                    Retry Capture
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FaceVerification;
