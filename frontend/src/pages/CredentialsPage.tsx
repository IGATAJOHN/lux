import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { accessApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Shield, Key, QrCode, Download, RefreshCw, Loader2, CheckCircle2, Copy } from 'lucide-react';

interface Credentials {
    user_id: number;
    access_level: string;
    has_pin: boolean;
    has_qr_code: boolean;
    qr_expiration: string | null;
    qr_code_base64: string | null;
}

const CredentialsPage: React.FC = () => {
    const { user } = useAuth();
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<'pin' | 'qr' | null>(null);
    const [newPin, setNewPin] = useState<string | null>(null);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        setIsLoading(true);
        try {
            const response = await accessApi.getMyCredentials();
            setCredentials(response.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load credentials',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePin = async () => {
        setIsGenerating('pin');
        try {
            const response = await accessApi.generatePin();
            setNewPin(response.data.pin);
            toast({
                title: 'PIN Generated',
                description: response.data.message,
            });
            fetchCredentials();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate PIN',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(null);
        }
    };

    const handleGenerateQr = async () => {
        setIsGenerating('qr');
        try {
            const response = await accessApi.generateQr();
            toast({
                title: 'QR Code Generated',
                description: response.data.message,
            });
            fetchCredentials();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate QR code',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(null);
        }
    };

    const downloadQR = () => {
        if (credentials?.qr_code_base64) {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${credentials.qr_code_base64}`;
            link.download = `luxestay-qr-${credentials.user_id}.png`;
            link.click();
            toast({ title: 'QR Downloaded!', description: 'QR code saved to your device' });
        }
    };

    const copyPin = () => {
        if (newPin) {
            navigator.clipboard.writeText(newPin);
            toast({ title: 'PIN Copied!', description: 'PIN copied to clipboard' });
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="font-display text-4xl font-bold text-foreground mb-2">
                        Access Credentials
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your secure access PIN and QR code
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* PIN Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Key className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">Access PIN</h2>
                                <p className="text-sm text-muted-foreground">
                                    {credentials?.has_pin ? '6-digit secure PIN' : 'Not generated'}
                                </p>
                            </div>
                        </div>

                        {credentials?.has_pin ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">PIN is active</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Your PIN is securely stored and cannot be viewed. Generate a new PIN to replace the existing one.
                                </p>
                                <Button
                                    onClick={handleGeneratePin}
                                    disabled={isGenerating === 'pin'}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {isGenerating === 'pin' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Generate New PIN
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={handleGeneratePin}
                                disabled={isGenerating === 'pin'}
                                variant="default"
                                className="w-full"
                            >
                                {isGenerating === 'pin' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Key className="mr-2 h-4 w-4" />
                                        Generate PIN
                                    </>
                                )}
                            </Button>
                        )}

                        {newPin && (
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                    Your New PIN:
                                </p>
                                <div className="bg-white dark:bg-gray-900 p-3 rounded text-2xl font-mono font-bold text-center tracking-wider mb-3">
                                    {newPin}
                                </div>
                                <Button onClick={copyPin} variant="outline" size="sm" className="w-full">
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy PIN
                                </Button>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                                    ⚠️ Save this PIN securely. It will not be shown again.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* QR Code Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <QrCode className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">QR Code</h2>
                                <p className="text-sm text-muted-foreground">
                                    {credentials?.has_qr_code ? 'Access QR code' : 'Not generated'}
                                </p>
                            </div>
                        </div>

                        {credentials?.has_qr_code && credentials.qr_code_base64 ? (
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg flex justify-center">
                                    <img
                                        src={`data:image/png;base64,${credentials.qr_code_base64}`}
                                        alt="Access QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>

                                {credentials.qr_expiration && (
                                    <p className="text-sm text-muted-foreground text-center">
                                        Expires: {new Date(credentials.qr_expiration).toLocaleDateString()}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={downloadQR} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                    <Button
                                        onClick={handleGenerateQr}
                                        disabled={isGenerating === 'qr'}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {isGenerating === 'qr' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Regenerate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={handleGenerateQr}
                                disabled={isGenerating === 'qr'}
                                variant="default"
                                className="w-full"
                            >
                                {isGenerating === 'qr' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Generate QR Code
                                    </>
                                )}
                            </Button>
                        )}
                    </Card>
                </div>

                {/* Info Card */}
                <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                About Your Credentials
                            </h3>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• Your PIN is used for quick secure access</li>
                                <li>• QR code contains encrypted access information</li>
                                <li>• Both credentials expire after 1 year</li>
                                <li>• You can regenerate them at any time</li>
                                <li>• Access Level: <span className="font-semibold capitalize">{credentials?.access_level}</span></li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default CredentialsPage;
