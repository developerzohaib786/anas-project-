import { useState } from "react";
import { Plus } from "lucide-react";
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

  const examplePrompts = [
    "Create a luxury poolside scene with cabanas at sunset",
    "Generate an elegant hotel suite with ocean views and modern decor",
    "Design a sophisticated restaurant dining area with ambient lighting",
    "Create a spa treatment room with natural elements and soft lighting",
    "Generate a rooftop bar scene with city skyline views at golden hour",
    "Design a family-friendly pool area with fun activities and tropical vibes"
  ];

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

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
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <ScrollArea className="flex-1 minimal-scroll">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                <div
                  className={`max-w-[85%] px-5 py-3.5 transition-all duration-200 ${
                    message.role === "user"
                      ? "bg-[hsl(var(--chat-user-bubble))] text-[hsl(var(--chat-user-text))] rounded-[20px] rounded-br-[8px]"
                      : "bg-[hsl(var(--chat-assistant-bubble))] text-[hsl(var(--chat-assistant-text))] rounded-[20px] rounded-bl-[8px]"
                  }`}
                  style={{
                    boxShadow: 'var(--shadow-minimal)'
                  }}
                >
                  <p className="text-[15px] leading-relaxed font-normal">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Example Prompts - Show when conversation is minimal and input is empty */}
          {messages.length <= 1 && !inputValue.trim() && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3 font-medium">Try these examples:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left p-3 rounded-2xl bg-muted/50 hover:bg-muted/80 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your hotel marketing photo..."
                  className="w-full h-12 bg-[hsl(var(--chat-input-bg))] border border-[hsl(var(--chat-input-border))] rounded-full px-5 text-[15px] placeholder:text-muted-foreground focus:bg-background focus:border-ring/20 focus:ring-2 focus:ring-ring/10 transition-all duration-200 resize-none"
                />
              </div>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              size="icon"
              className="apple-button h-12 w-12 rounded-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground shrink-0"
              style={{
                boxShadow: !inputValue.trim() ? 'none' : 'var(--shadow-button)'
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}