import { useState, useEffect } from "react";
import { Mic, PhoneOff, Waveform } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const VoiceChat = () => {
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(true);
    const [volume, setVolume] = useState(0);

    // Mock volume animation
    useEffect(() => {
        if (!isListening) return;
        const interval = setInterval(() => {
            setVolume(Math.random() * 100);
        }, 100);
        return () => clearInterval(interval);
    }, [isListening]);

    const handleEndCall = () => {
        setIsListening(false);
        // Return to previous page or dashboard
        navigate(-1);
    };

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-8 max-w-md w-full p-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Voice Assistant</h1>
                    <p className="text-muted-foreground">Listening...</p>
                </div>

                {/* Visualizer Circle */}
                <div className="relative flex items-center justify-center w-64 h-64">
                    <div
                        className="absolute inset-0 bg-primary/10 rounded-full animate-ping"
                        style={{ animationDuration: '2s' }}
                    />
                    <div
                        className="absolute inset-0 bg-primary/5 rounded-full"
                        style={{
                            transform: `scale(${1 + volume / 200})`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    />
                    <div className="relative bg-background p-8 rounded-full border-4 border-primary/20 shadow-xl">
                        <Mic className="w-16 h-16 text-primary animate-pulse" />
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-8">
                    <Button
                        variant="destructive"
                        size="lg"
                        className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                        onClick={handleEndCall}
                    >
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-4">Tap to end session</p>
            </div>
        </div>
    );
};

export default VoiceChat;
