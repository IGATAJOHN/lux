import { useState } from "react";
import { MessageCircle, X, Send, Mic, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
        { text: "Hello! How can I help you today?", isUser: false }
    ]);
    const navigate = useNavigate();

    const handleMicClick = () => {
        // Navigate to voice chat interface
        navigate("/voice-chat");
        setIsOpen(false); // Close the widget when moving to voice
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const handleSend = () => {
        if (!message.trim()) return;

        // Add user message
        const newMessages = [...messages, { text: message, isUser: true }];
        setMessages(newMessages);
        setMessage("");

        // Mock bot response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "I'm just a demo bot, but I heard you!",
                isUser: false
            }]);
        }, 1000);
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
                    <CardContent className="h-[400px] p-4 flex flex-col gap-4 overflow-y-auto bg-background/50 backdrop-blur-sm">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                                {!msg.isUser && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <MessageCircle className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div className={`rounded-2xl p-3 text-sm ${msg.isUser
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
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
                            />
                            <Button
                                size="icon"
                                className="shrink-0 rounded-full bg-primary shadow-sm hover:shadow-md transition-all"
                                onClick={handleSend}
                                disabled={!message.trim()}
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
