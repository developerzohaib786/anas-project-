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
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl rounded-3xl border border-black/8">
      {/* Messages - Compact */}
      <div className="flex-1 px-8 py-6 min-h-0">
        <div className="h-full overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-5 py-3 transition-all duration-300 ${
                    message.role === "user"
                      ? "bg-black text-white rounded-[20px] rounded-br-[8px]"
                      : "bg-gray-100/80 text-black rounded-[20px] rounded-bl-[8px]"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input - Compact */}
      <div className="px-8 pb-6">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your image..."
              className="w-full bg-white/80 border-0 rounded-2xl px-5 py-3 text-[15px] placeholder:text-gray-400 focus:bg-white transition-all duration-300"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="shrink-0 w-11 h-11 rounded-2xl bg-black hover:bg-gray-800 disabled:bg-gray-200 transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}