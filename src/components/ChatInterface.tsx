import { useState, useEffect, useRef } from "react";
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Volume2, Share, RotateCcw, X, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/ChatContext";
import { useParams } from "react-router-dom";
import { ChatInputControls } from "@/components/ChatInputControls";
import { PromptLibrary } from "@/components/PromptLibrary";

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
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // All available prompts pool
  const allPrompts = [
    "A high-flash photo of a martini on a bar top",
    "An overhead editorial shot of colorful dishes and cocktails", 
    "A moody, commercial-style shot of wine glasses clinking at golden hour",
    "A golden hour aerial shot of our hotel pool",
    "A cinematic lifestyle photo of sun loungers with cocktails",
    "A night-time luxury shot of the pool glowing under ambient lighting",
    "A golden hour editorial shot of a hotel suite with sunlight spilling in",
    "A commercial lifestyle shot of a guest reading on the balcony", 
    "A wide editorial shot of a king bed styled with plush linens",
    "A dramatic sunset shot of the hotel exterior with glowing windows",
    "A flash-lit night photo of the hotel entrance with cars arriving",
    "A golden hour shot of the rooftop terrace with city skyline views",
    "An editorial photo of a couple toasting champagne on a balcony at dusk",
    "A cinematic travel-style photo of friends laughing at the poolside bar",
    "An elegant lifestyle shot of spa treatments with tea service",
    "A vibrant lifestyle photo of a chef plating an elegant dish",
    "A dramatic close-up of champagne being poured into crystal glasses",
    "An artistic flat-lay of a gourmet breakfast spread with natural lighting",
    "An editorial photo of a couple relaxing by the infinity pool at sunset",
    "A dramatic overhead shot of the pool deck with geometric shadows",
    "A lifestyle photo of friends enjoying poolside cabanas",
    "A dramatic photo of a luxury bathroom with marble and ambient lighting",
    "An intimate shot of a couple enjoying room service on the terrace",
    "A design-focused photo showcasing the room's architectural details",
    "An architectural photo highlighting the building's unique design elements",
    "A cinematic wide shot of the hotel set against natural landscapes",
    "A commercial photo of the valet area with luxury vehicles",
    "A commercial photo of guests enjoying a sunset yoga session",
    "An editorial shot of a romantic dinner setup on a private terrace",
    "A lifestyle photo of a family enjoying hotel activities together"
  ];

  // Get 6 rotating prompts based on session ID or current time
  const getRotatingPrompts = () => {
    const seed = sessionId ? sessionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Date.now();
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  };

  const [examplePrompts] = useState(() => getRotatingPrompts());

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const fileArray = Array.from(e.target.files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const remainingSlots = 3 - uploadedImages.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setUploadedImages([...uploadedImages, ...newImages]);
    e.target.value = ''; // Reset input
  };

  const handleViewPrompts = () => {
    setPromptLibraryOpen(true);
  };

  const removeImage = (id: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== id);
    // Clean up object URLs
    const removedImage = uploadedImages.find(img => img.id === id);
    if (removedImage) {
      URL.revokeObjectURL(removedImage.url);
    }
    setUploadedImages(updatedImages);
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

      // Convert any attached images to base64
      let imageData: { data: string; name: string }[] | undefined = undefined;
      if (currentImages && currentImages.length > 0) {
        const convertToBase64 = (file: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

        try {
          imageData = await Promise.all(
            currentImages.map(async (img) => ({ data: await convertToBase64(img.file), name: img.name }))
          );
        } catch (e) {
          console.error("Failed to convert images for chat:", e);
        }
      }

      const { data, error } = await supabase.functions.invoke("chat-with-ai", {
        body: { 
          prompt: currentInput,
          messages: newMessages.slice(1), // Exclude the initial welcome message
          images: imageData
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
      {/* Hidden file input for route guide upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
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
           {/* Route Guide - Fixed height container to prevent layout shift */}
           <div className="mb-8 transition-all duration-300" style={{ height: messages.length <= 1 && !inputValue.trim() ? 'auto' : '0', overflow: 'hidden' }}>
             {messages.length <= 1 && !inputValue.trim() && (
               <div className="animate-fade-in">
                 <p className="text-sm text-muted-foreground mb-6 font-medium">
                   Choose your creation style:
                 </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 rounded-xl bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-all duration-200">
                      <h3 className="font-semibold text-foreground text-base mb-3">iPhone to Editorial</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Upload an iPhone photo and let Nino transform it into luxury marketing content. Perfect for turning everyday snapshots into professional visuals.
                      </p>
                      <Button 
                        onClick={handleImageUpload}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Try now
                      </Button>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-all duration-200">
                      <h3 className="font-semibold text-foreground text-base mb-3">Chat / Prompts</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Describe your vision or use our expert prompt library for precise creative control. Ideal for specific requirements and creative exploration.
                      </p>
                      <Button 
                        onClick={handleViewPrompts}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg"
                        size="sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Browse prompts
                      </Button>
                    </div>
                  </div>
               </div>
             )}
           </div>

           {/* Example Prompts - Fixed height container to prevent layout shift */}
           <div className="mb-6 transition-all duration-300" style={{ height: messages.length <= 1 && !inputValue.trim() ? 'auto' : '0', overflow: 'hidden' }}>
             {messages.length <= 1 && !inputValue.trim() && (
               <div className="animate-fade-in">
                 <p className="text-sm text-muted-foreground mb-4 font-medium">
                   Get inspired with these examples:
                 </p>
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

           {/* Uploaded Images Preview */}
           {uploadedImages.length > 0 && (
             <div className="mb-4">
               <div className="flex flex-wrap gap-2">
                 {uploadedImages.map((image) => (
                   <div key={image.id} className="relative group">
                     <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                       <img
                         src={image.url}
                         alt={image.name}
                         className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <Button
                         size="icon"
                         variant="destructive"
                         className="absolute top-1 right-1 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={(e) => {
                           e.stopPropagation();
                           removeImage(image.id);
                         }}
                       >
                         <X className="h-3 w-3" />
                       </Button>
                     </div>
                     <p className="text-xs text-muted-foreground mt-1 truncate w-16">
                       {image.name}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* Input Row */}
           <div className="flex items-end gap-3">
             <div className="flex-1">
               <div className="relative">
                 <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                   <ChatInputControls
                     images={uploadedImages}
                     onImagesChange={setUploadedImages}
                     onPromptSelect={handlePromptClick}
                     maxImages={3}
                   />
                 </div>
                 <Input
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Describe your hotel marketing photo..."
                   className="w-full h-12 bg-transparent border border-[hsl(var(--border))] rounded-full pl-12 pr-6 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[hsl(var(--border))] hover:border-[hsl(var(--border))] resize-none min-h-[48px] max-h-[48px]"
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

      <PromptLibrary
        open={promptLibraryOpen}
        onOpenChange={setPromptLibraryOpen}
        onPromptSelect={handlePromptClick}
      />
    </div>
  );
}