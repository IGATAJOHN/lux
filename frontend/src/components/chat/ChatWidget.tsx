
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const sessionIdRef = useRef<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial message
    const [messages, setMessages] = useState<{ text: string; isUser: boolean; image?: string }[]>([
        { text: "Hello! Type 'Hi' to start the NIN Signup process.", isUser: false }
    ]);
    const navigate = useNavigate();

    // Scroll to bottom effect
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleMicClick = () => {
        navigate("/voice-chat");
        setIsOpen(false);
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        // User Message
        const userMsg = message;
        setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
        setMessage("");
        setIsLoading(true);

        try {
            const response = await fetch(`http://localhost:8000/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({
                    message: userMsg,
                    session_id: sessionIdRef.current
                })
            });

            const data = await response.json();

            // Save session ID
            if (data.session_id) {
                sessionIdRef.current = data.session_id;
            }

            // Bot Response
            setMessages(prev => {
                const newMsgs = [...prev, { text: data.response, isUser: false }];

                // If QR code returned
                if (data.action === "completed" && data.data?.qr_code) {
                    newMsgs.push({
                        text: "Scan this QR code or screenshot it for access.",
                        isUser: false,
                        image: data.data.qr_code
                    });
                }
                return newMsgs;
            });

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting. Please try again.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Chat Window */}
            {isOpen && !isMinimized && (
                <Card className="w-[350px] md:w-[400px] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-primary/5 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <CardTitle className="text-sm font-medium">Support Assistant</CardTitle>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent ref={scrollRef} className="h-[400px] p-4 flex flex-col gap-4 overflow-y-auto bg-background/50 backdrop-blur-sm">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                                {!msg.isUser && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <MessageCircle className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <div className={`rounded-2xl p-3 text-sm ${msg.isUser
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                    {msg.image && (
                                        <div className="flex flex-col gap-2">
                                            <img
                                                src={`data:image/png;base64,${msg.image}`}
                                                alt="QR Code"
                                                className="w-48 h-48 rounded-lg border border-border bg-white p-2"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = `data:image/png;base64,${msg.image}`;
                                                    link.download = 'luxestay-access-qr.png';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                Download QR Code
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 max-w-[85%]">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-muted rounded-2xl p-3 text-sm rounded-tl-none flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="p-3 bg-background border-t">
                        <div className="flex w-full items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-dashed"
                                onClick={handleMicClick}
                                title="Switch to Voice Mode"
                            >
                                <Mic className="h-4 w-4" />
                            </Button>
                            <Input
                                placeholder="Type a message..."
                                className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                className="shrink-0 rounded-full bg-primary shadow-sm hover:shadow-md transition-all"
                                onClick={handleSend}
                                disabled={isLoading || !message.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                size="lg"
                className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${isOpen && !isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                onClick={toggleOpen}
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        </div>
    );
};

export default ChatWidget;
