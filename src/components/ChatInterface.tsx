import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  onGenerateImage: (prompt: string) => void;
}

export function ChatInterface({ onGenerateImage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! Describe what you'd like me to create.",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Trigger image generation
    onGenerateImage(inputValue);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Creating your image...",
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/80 backdrop-blur-xl rounded-3xl border border-black/5 shadow-2xl shadow-black/5">
      {/* Messages */}
      <ScrollArea className="flex-1 px-8 py-8">
        <div className="space-y-8">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <div
                className={`group max-w-[75%] px-6 py-4 transition-all duration-300 ${
                  message.role === "user"
                    ? "bg-black text-white rounded-[26px] rounded-br-[12px]"
                    : "bg-gray-50/80 text-black rounded-[26px] rounded-bl-[12px] border border-black/5"
                }`}
              >
                <p className="text-[16px] leading-relaxed font-normal">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-8">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="w-full bg-gray-50/50 border-0 rounded-3xl px-6 py-4 text-[16px] placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-black/10 transition-all duration-300"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="shrink-0 w-12 h-12 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-200 transition-all duration-300 disabled:hover:scale-100 hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}