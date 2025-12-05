import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onClose?: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please grant permission.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = imageData.split(',')[1];
        setCapturedImage(imageData);
        stopCamera();
        return base64;
      }
    }
    return null;
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      const base64 = capturedImage.split(',')[1];
      onCapture(base64);
    }
  }, [capturedImage, onCapture]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-[4/3] bg-card/50 rounded-2xl overflow-hidden border border-border">
        {/* Camera Frame Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-8 border-2 border-primary/50 rounded-full" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs text-muted-foreground">Position your face in the circle</span>
          </div>
        </div>

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Camera className="w-12 h-12 text-muted-foreground" />
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" onClick={startCamera}>
              Try Again
            </Button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="absolute top-3 right-3 z-20 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={retake} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" />
              Retake
            </Button>
            <Button onClick={confirmCapture} className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Confirm
            </Button>
          </>
        ) : (
          <Button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="flex-1 gap-2"
          >
            <Camera className="w-4 h-4" />
            Capture Photo
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
