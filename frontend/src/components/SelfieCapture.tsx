import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, RotateCcw, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SelfieCaptureProps {
    onCapture: (base64Image: string) => void;
    value?: string;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, value }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | undefined>(value);
    const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
    const [cameraError, setCameraError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (value) {
            setCapturedImage(value);
            setMode('upload');
        }
    }, [value]);

    useEffect(() => {
        return () => {
            // Cleanup camera stream on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    useEffect(() => {
        if (isCameraActive && videoRef.current && stream) {
            const video = videoRef.current;
            video.srcObject = stream;

            const handlePlay = () => console.log('Video started playing');
            const handleError = (e: any) => console.error('Video error:', e);

            video.addEventListener('play', handlePlay);
            video.addEventListener('error', handleError);

            // Force play
            video.play().catch(e => console.error('Error attempting to play video:', e));

            return () => {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('error', handleError);
            };
        }
    }, [isCameraActive, stream]);

    const startCamera = async () => {
        setIsLoading(true);
        setCameraError('');
        try {
            console.log('Requesting camera access...');

            let mediaStream: MediaStream;

            // Check if mediaDevices API is available (modern browsers)
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                });
            }
            // Fallback for older browsers or non-secure contexts (if supported)
            else {
                const getUserMedia = (navigator as any).getUserMedia ||
                    (navigator as any).webkitGetUserMedia ||
                    (navigator as any).mozGetUserMedia ||
                    (navigator as any).msGetUserMedia;

                if (!getUserMedia) {
                    throw new Error('Camera API not supported in this browser or context (HTTP). Please use "Upload Photo" instead.');
                }

                mediaStream = await new Promise((resolve, reject) => {
                    getUserMedia.call(navigator,
                        { video: { facingMode: 'user' } },
                        resolve,
                        reject
                    );
                });
            }

            console.log('Camera access granted!', mediaStream);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Wait for video to be ready
                await new Promise((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = resolve;
                    }
                });
            }
            setIsCameraActive(true);
            setMode('camera');
            console.log('Camera mode activated! isCameraActive:', true, 'mode:', 'camera');
        } catch (error: any) {
            console.error('Camera access error:', error);
            const errorMsg = error.name === 'NotAllowedError'
                ? 'Camera permission denied. Please allow camera access.'
                : error.name === 'NotFoundError'
                    ? 'No camera found on this device.'
                    : error.message || 'Failed to access camera.';

            setCameraError(errorMsg);

            // If on mobile and failed, suggest upload
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                setCameraError(`${errorMsg} Try "Upload Photo" instead.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Check if video is loaded and has dimensions
            if (!video.videoWidth || !video.videoHeight) {
                alert('Video not ready. Please wait a moment and try again.');
                return;
            }

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);

                const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                console.log('Captured image:', base64Image.substring(0, 50) + '...');
                setCapturedImage(base64Image);
                onCapture(base64Image);
                stopCamera();
            }
        } else {
            console.error('Video or canvas ref is null');
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result as string;
                setCapturedImage(base64Image);
                onCapture(base64Image);
                setMode('upload');
            };
            reader.readAsDataURL(file);
        }
    };

    const resetCapture = () => {
        setCapturedImage(undefined);
        setMode('select');
        stopCamera();
    };

    if (mode === 'select') {
        return (
            <Card className="p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Capture Your Selfie
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        We'll use your selfie for biometric verification. Choose how you'd like to provide your photo:
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-32 flex-col gap-3"
                            onClick={startCamera}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Starting Camera...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="h-8 w-8" />
                                    <span>Use Camera</span>
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="h-32 flex-col gap-3"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8" />
                            <span>Upload Photo</span>
                        </Button>
                    </div>

                    {cameraError && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm">
                            {cameraError}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
            </Card>
        );
    }

    if (mode === 'camera' && isCameraActive) {
        return (
            <Card className="p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Position Your Face
                    </h3>

                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onLoadedMetadata={() => console.log('Video loaded metadata:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)}
                            onLoadedData={() => console.log('Video loaded data')}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1"
                            variant="default"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Capture Photo
                        </Button>
                        <Button
                            type="button"
                            onClick={resetCapture}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </Card>
        );
    }

    if (capturedImage) {
        return (
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Selfie Captured
                        </h3>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={resetCapture}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retake
                        </Button>
                    </div>

                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <img
                            src={capturedImage}
                            alt="Captured selfie"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </Card>
        );
    }

    return null;
};
