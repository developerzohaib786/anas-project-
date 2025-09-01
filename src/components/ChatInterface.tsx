import { useState, useEffect, useRef } from "react";
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Volume2, Share, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/ChatContext";
import { useParams } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isGenerating?: boolean;
  images?: UploadedImage[];
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface ChatInterfaceProps {
  onGenerateImage: (prompt: string, images?: UploadedImage[]) => void;
}

export function ChatInterface({ onGenerateImage }: ChatInterfaceProps) {
  const { sessionId } = useParams();
  const { sessions, currentSessionId, createSession, updateSession, setCurrentSession, getCurrentSession } = useChat();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "What are we creating today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(sessionId);
        setMessages(session.messages.length > 0 ? session.messages : [
          {
            id: "1",
            content: "What are we creating today?",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    } else if (!currentSessionId) {
      // Create a new session if none exists
      const newSessionId = createSession();
      window.history.replaceState(null, '', `/chat/${newSessionId}`);
    }
  }, [sessionId, sessions, currentSessionId, createSession, setCurrentSession]);

  // Save messages to session when they change
  useEffect(() => {
    if (currentSessionId && messages.length > 1) {
      updateSession(currentSessionId, { 
        messages,
        title: generateSessionTitle(messages)
      });
    }
  }, [messages, currentSessionId, updateSession]);

  const generateSessionTitle = (msgs: Message[]): string => {
    const userMessage = msgs.find(m => m.role === "user");
    if (userMessage) {
      const words = userMessage.content.trim().split(' ');
      if (words.length <= 3) {
        return userMessage.content;
      }
      return words.slice(0, 3).join(' ') + '...';
    }
    return `Chat ${new Date().toLocaleDateString()}`;
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
    };

    // Add user message immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const currentInput = inputValue;
    const currentImages = [...uploadedImages];
    setInputValue("");
    setUploadedImages([]);

    try {
      // Call the real AI chat API
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("chat-with-ai", {
        body: { 
          prompt: currentInput,
          messages: newMessages.slice(1) // Exclude the initial welcome message
        },
      });

      if (error) {
        throw error;
      }

      // Parse the AI response properly
      let aiResponse = data.response;
      let intent = data.intent;
      let imagePrompt = data.image_prompt;

      // If the response is still JSON string, parse it
      if (typeof aiResponse === 'string' && aiResponse.includes('"intent"')) {
        try {
          const parsed = JSON.parse(aiResponse);
          aiResponse = parsed.response;
          intent = parsed.intent;
          imagePrompt = parsed.image_prompt;
        } catch (e) {
          // If parsing fails, extract just the response part
          const match = aiResponse.match(/"response":\s*"([^"]+)"/);
          if (match) {
            aiResponse = match[1];
          }
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse || "Let me create that image for you!",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if we should generate an image
      if (intent === 'generate' || 
          (typeof aiResponse === 'string' && (
            aiResponse.toLowerCase().includes('generating') ||
            aiResponse.toLowerCase().includes('create your image') ||
            aiResponse.toLowerCase().includes("let's make") ||
            aiResponse.toLowerCase().includes('ready to create')
          ))) {
        
        // Add a generating message with shimmer effect
        const generatingMessageId = (Date.now() + 1).toString();
        const generatingMessage: Message = {
          id: generatingMessageId,
          content: "🎨 Generating your image now...",
          role: "assistant",
          timestamp: new Date(),
          isGenerating: true, // Add flag for shimmer effect
        };

        setMessages((prev) => [...prev, generatingMessage]);

        // Mark session as completed when generating image
        if (currentSessionId) {
          updateSession(currentSessionId, { isCompleted: true });
        }
        
        // Trigger image generation and remove generating message when done
        try {
          await onGenerateImage(imagePrompt || currentInput, currentImages);
          // Remove the generating message after image generation completes
          setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
        } catch (error) {
          // Remove generating message even if there's an error
          setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
        }
      }

    } catch (error) {
      console.error('AI chat error:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Messages */}
      <ScrollArea className="flex-1 minimal-scroll" ref={scrollAreaRef}>
        <div className="w-full px-4 py-8 pb-32 md:px-6 md:py-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                <div className={`max-w-[80%] group`}>
                  <div className={`${message.role === "user" ? "inline-block bg-muted px-4 py-2.5 rounded-2xl" : "mb-2 text-left"}`}>
                    {/* Display images if present */}
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.images.map((img) => (
                          <div key={img.id} className="relative">
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-20 h-20 object-cover rounded-lg border border-border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[15px] leading-relaxed font-normal text-foreground">
                      {message.isGenerating ? (
                        <>🎨 <span className="shimmer-text">Generating your image now...</span></>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons for AI messages */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <Share className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Input Area at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="w-full px-4 py-6 md:px-6">
          <div className="max-w-3xl mx-auto">
          {/* Example Prompts - Fixed height container to prevent layout shift */}
          <div className="mb-6 transition-all duration-300" style={{ height: messages.length <= 1 && !inputValue.trim() ? 'auto' : '0', overflow: 'hidden' }}>
            {messages.length <= 1 && !inputValue.trim() && (
              <div className="animate-fade-in">
                <p className="text-sm text-muted-foreground mb-4 font-medium">Try these examples:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left p-4 rounded-xl bg-muted/30 hover:bg-muted/60 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <ImageUpload 
              images={uploadedImages}
              onImagesChange={setUploadedImages}
              maxImages={3}
            />
          </div>

          {/* Input Row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your hotel marketing photo..."
                  className="w-full h-12 bg-transparent border border-[hsl(var(--border))] rounded-full px-6 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[hsl(var(--border))] hover:border-[hsl(var(--border))] resize-none min-h-[48px] max-h-[48px]"
                />
              </div>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && uploadedImages.length === 0}
              size="icon"
              className="h-12 w-12 rounded-full bg-muted hover:bg-muted/80 disabled:bg-muted disabled:text-muted-foreground shrink-0 min-h-[48px] min-w-[48px]"
            >
              <ArrowUp className="h-5 w-5 text-foreground" strokeWidth={3} />
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}