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
    <div className="flex flex-col h-screen bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <div className="bg-gray-50 rounded-2xl p-1 border border-gray-200 focus-within:border-gray-300 focus-within:bg-white transition-all">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe the hotel marketing photo you want to create..."
                  className="w-full bg-transparent border-0 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:ring-0 focus:outline-none resize-none min-h-[44px]"
                />
              </div>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 w-11 h-11 rounded-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}