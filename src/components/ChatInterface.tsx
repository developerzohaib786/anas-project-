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
      content: "Hi! I'm Nino, your AI creative assistant for hotels and resorts. I'll help you create stunning marketing photos. What would you like me to create for you today?",
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

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate AI response with follow-up questions
    setTimeout(() => {
      let assistantResponse = "Great! Let me help you create that. ";
      
      // Simple logic to ask follow-up questions based on input
      const input = inputValue.toLowerCase();
      
      if (!input.includes('hotel') && !input.includes('resort') && !input.includes('room') && !input.includes('pool')) {
        assistantResponse += "What type of hotel or resort space would you like to showcase? (e.g., luxury suite, pool area, dining room, spa)";
      } else if (!input.includes('style') && !input.includes('mood') && !input.includes('luxury') && !input.includes('modern')) {
        assistantResponse += "What style or mood are you going for? (e.g., luxury, modern, cozy, romantic, family-friendly)";
      } else if (!input.includes('guest') && !input.includes('people') && !input.includes('family') && !input.includes('couple')) {
        assistantResponse += "Should I include people in the scene? If so, what type of guests? (e.g., couples, families, business travelers)";
      } else {
        assistantResponse = "Perfect! I have enough information to create your image. Generating your hotel marketing photo now...";
        // Trigger image generation
        onGenerateImage(inputValue);
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: assistantResponse,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
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
              placeholder="Describe the hotel marketing photo you want to create..."
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