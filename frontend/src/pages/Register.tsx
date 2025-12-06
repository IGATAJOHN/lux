import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Hotel, Mail, Lock, Eye, EyeOff, User, Phone, Loader2, CheckCircle2, Copy, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { SelfieCapture } from '@/components/SelfieCapture';
import { authApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uniqueIdValid, setUniqueIdValid] = useState<boolean | null>(null);
  const [uniqueIdChecking, setUniqueIdChecking] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    unique_id: '',
    selfie_image: '',
  });

  const [registrationResult, setRegistrationResult] = useState<{
    pin: string;
    qr_code_base64: string;
    token: string;
    fraud_score: number;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset unique ID validation when user types
    if (name === 'unique_id') {
      setUniqueIdValid(null);
    }
  };

  const verifyUniqueId = async () => {
    if (!formData.unique_id || formData.unique_id.length !== 11 || !/^\d+$/.test(formData.unique_id)) {
      toast({
        title: 'Invalid ID',
        description: 'NIN must be exactly 11 digits',
        variant: 'destructive',
      });
      return;
    }

    setUniqueIdChecking(true);
    try {
      const response = await authApi.verifyUniqueId(formData.unique_id);
      const data = response.data;

      if (!data.is_valid) {
        toast({
          title: 'Invalid Format',
          description: 'NIN must be 11 numeric digits',
          variant: 'destructive',
        });
        setUniqueIdValid(false);
      } else if (data.is_duplicate) {
        toast({
          title: 'ID Already Taken',
          description: `Try: ${data.suggestions?.join(', ')}`,
          variant: 'destructive',
        });
        setUniqueIdValid(false);
      } else {
        setUniqueIdValid(true);
        toast({
          title: 'ID Available!',
          description: 'This unique ID is available',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Unable to verify unique ID',
        variant: 'destructive',
      });
    } finally {
      setUniqueIdChecking(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: 'Missing Password',
        description: 'Please enter and confirm your password',
        variant: 'destructive',
      });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }
    if (formData.password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }
    if (!uniqueIdValid) {
      toast({
        title: 'Unique ID Required',
        description: 'Please verify your NIN first',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.selfie_image) {
      toast({
        title: 'Selfie Required',
        description: 'Please capture or upload your selfie',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        unique_id: formData.unique_id,
        selfie_image: formData.selfie_image,
      });

      setRegistrationResult(response.data);
      setStep(4); // Show success with credentials

      toast({
        title: 'Registration Successful!',
        description: 'Please save your PIN and QR code',
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || 'Registration failed';
      toast({
        title: 'Registration Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPin = () => {
    if (registrationResult) {
      navigator.clipboard.writeText(registrationResult.pin);
      toast({ title: 'PIN Copied!', description: 'PIN copied to clipboard' });
    }
  };

  const downloadQR = () => {
    if (registrationResult) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${registrationResult.qr_code_base64}`;
      link.download = 'luxestay-qr-code.png';
      link.click();
      toast({ title: 'QR Downloaded!', description: 'QR code saved to your device' });
    }
  };

  const proceedToLogin = () => {
    // Store token in localStorage
    if (registrationResult) {
      localStorage.setItem('token', registrationResult.token);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/luxury-bg.png"
            alt="Luxury Hotel Lobby"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-display text-5xl font-bold text-foreground mb-6">
            Join the <span className="gradient-text">Experience</span>
          </h2>
          <p className="text-xl font-bold text-white max-w-md drop-shadow-md">
            Enhanced biometric registration with secure access credentials
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hotel className="h-8 w-8 text-primary" />
              </div>
              <span className="font-display text-2xl font-semibold text-foreground">
                Luxe<span className="text-primary">Stay</span>
              </span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground">Create Account</h1>
            <p className="mt-2 text-muted-foreground">
              {step === 4 ? 'Registration Complete!' : `Step ${step} of 3`}
            </p>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="gold" className="w-full" size="lg">
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Step 2: Password & Unique ID */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unique_id">NIN (National Identity Number)</Label>
                <div className="flex gap-2">
                  <Input
                    id="unique_id"
                    name="unique_id"
                    type="text"
                    maxLength={11}
                    placeholder="12345678901"
                    value={formData.unique_id}
                    onChange={handleChange}
                    className={uniqueIdValid === true ? 'border-green-500' : uniqueIdValid === false ? 'border-red-500' : ''}
                    required
                  />
                  <Button
                    type="button"
                    onClick={verifyUniqueId}
                    disabled={uniqueIdChecking}
                    variant="outline"
                  >
                    {uniqueIdChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be exactly 11 digits
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" variant="gold" className="flex-1">
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Biometric Capture */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <SelfieCapture
                value={formData.selfie_image}
                onCapture={(base64) => setFormData({ ...formData, selfie_image: base64 })}
              />

              <div className="flex gap-3">
                <Button type="button" onClick={() => setStep(2)} variant="outline" className="flex-1" disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Success & Credentials */}
          {step === 4 && registrationResult && (
            <div className="space-y-6">
              <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Account Created!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Fraud Score: {registrationResult.fraud_score.toFixed(1)}% {registrationResult.fraud_score < 30 ? '(Low Risk)' : '(Medium Risk)'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your Access PIN</h3>
                <div className="bg-secondary p-4 rounded-lg mb-4">
                  <p className="text-3xl font-mono font-bold text-center tracking-wider">{registrationResult.pin}</p>
                </div>
                <Button onClick={copyPin} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy PIN
                </Button>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Save this PIN securely. It will not be shown again.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your QR Code</h3>
                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <img
                    src={`data:image/png;base64,${registrationResult.qr_code_base64}`}
                    alt="Access QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <Button onClick={downloadQR} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </Card>

              <Button onClick={proceedToLogin} variant="gold" className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </div>
          )}

          {step < 4 && (
            <div className="text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
