import { useState, useEffect, useRef } from "react";
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Volume2, Share, RotateCcw, X, Upload, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { PromptLibrary } from "@/components/PromptLibrary";
import { ImageUpload } from "@/components/ImageUpload";
import { handleError, withErrorHandling, ApiError, NetworkError } from "@/lib/error-handler";
import { useSmartSession } from "@/hooks/useSmartSession";
import { toast } from "sonner";
import CloudinaryBrowserService from '@/services/cloudinaryBrowserService';

import { Message, UploadedImage, FlowType } from "@/types/common";

/**
 * Props for the ChatInterface component
 * @interface ChatInterfaceProps
 * @property {function} onGenerateImage - Callback to generate images from prompts
 * @property {string} initialPrompt - Pre-fill the input with this prompt
 * @property {boolean} showImageUpload - Show the 3-step upload process (for Enhance Photo page)
 * @property {string} initialMessage - Custom greeting message
 * @property {boolean} showPrompts - Show example prompt suggestions
 * @property {FlowType} flowType - The workflow type for session management
 * @property {UploadedImage[]} uploadedImages - External uploaded images state
 * @property {function} onImagesChange - Callback when images change (external state management)
 */
interface ChatInterfaceProps {
  onGenerateImage: (prompt: string, images?: UploadedImage[]) => void;
  initialPrompt?: string;
  showImageUpload?: boolean;
  initialMessage?: string;
  showPrompts?: boolean;
  flowType: FlowType;
  uploadedImages?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
  generatedImage?: string; // Add generated image prop
  currentPrompt?: string; // Add current prompt prop
}

/**
 * ChatInterface Component
 * 
 * Main chat interface for both Enhance Photo and Chat to Create workflows.
 * Features:
 * - Conditional UI based on workflow (showImageUpload, showPrompts)
 * - Auto-prompt filling for image enhancement
 * - User input tracking to prevent unwanted prompt regeneration
 * - Dual image display (upload area + chat preview)
 * - Example prompt suggestions
 * - Style transformation options for Chat to Create
 * 
 * @param {ChatInterfaceProps} props - Component props
 * @returns {JSX.Element} The ChatInterface component
 */
export function ChatInterface({ onGenerateImage, initialPrompt, showImageUpload = false, initialMessage, showPrompts = true, flowType, uploadedImages: externalUploadedImages, onImagesChange: externalOnImagesChange, generatedImage, currentPrompt }: ChatInterfaceProps) {
  const { sessionId: urlSessionId } = useParams();
  const { sessions, currentSessionId, createSession, updateSession, setCurrentSession, getCurrentSession, saveMessage, loadSessionMessages } = useChat();
  const { user } = useAuth();
  
  // Get session ID from URL params or use current session
  const sessionId = urlSessionId || currentSessionId;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: initialMessage || "What are we creating today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  // Use external image state if provided, otherwise use local state
  const [localUploadedImages, setLocalUploadedImages] = useState<UploadedImage[]>([]);
  const uploadedImages = externalUploadedImages || localUploadedImages;
  const setUploadedImages = externalOnImagesChange || setLocalUploadedImages;
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track if user manually cleared the text to prevent unwanted auto-filling
  const hasUserClearedText = useRef(false);

  // Set initial prompt if provided (one-time setup)
  useEffect(() => {
    if (initialPrompt && !inputValue) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt]); // Removed inputValue dependency to prevent re-runs

  // Removed auto-prompt functionality - user will provide their own prompts

  // Reset the user cleared flag when images change (new upload session)
  useEffect(() => {
    hasUserClearedText.current = false;
  }, [uploadedImages.length]);

  // Smart session management for the new chat button
  const { startNewSession } = useSmartSession(flowType, [
    () => uploadedImages.length > 0,
    () => inputValue.trim().length > 0,
    () => messages.length > 1 // More than just the initial assistant message
  ]);

  // Handle new chat button click
  const handleNewChat = () => {
    const result = startNewSession(() => {
      // Clear all component state for fresh start
      setLocalUploadedImages([]);
      setInputValue("");
      setMessages([
        {
          id: "1",
          content: initialMessage || "What are we creating today?",
          role: "assistant",
          timestamp: new Date(),
        }
      ]);
      hasUserClearedText.current = false;
    });

    // If new session was created, navigate to it
    if (result.type === 'created' && result.sessionId) {
      if (flowType === 'create') {
        window.history.replaceState(null, '', `/create`);
      } else if (flowType === 'enhance') {
        window.history.replaceState(null, '', `/`);
      } else if (flowType === 'video') {
        window.history.replaceState(null, '', `/video`);
      }
    }
  };

  // Track if we've already loaded messages for this session
  const [loadedSessions, setLoadedSessions] = useState<Set<string>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load session data when sessionId changes
  useEffect(() => {
    const loadSessionData = async () => {
      console.log("🔄 ChatInterface loading session data:", { sessionId, currentSessionId, sessionsCount: sessions.length });
      
      if (sessionId && !loadedSessions.has(sessionId) && !isLoadingMessages) {
        const session = sessions.find(s => s.id === sessionId);
        console.log("📋 Found session:", session ? "Yes" : "No", session?.title);
        
        if (session) {
          setCurrentSession(sessionId);
          
          // Load messages from Supabase if session exists but has no local messages
          if (session.messages.length === 0) {
            console.log("📡 Loading messages from Supabase for session:", sessionId);
            setIsLoadingMessages(true);
            try {
              const supabaseMessages = await loadSessionMessages(sessionId);
              console.log("📨 Received messages from API:", supabaseMessages.length, supabaseMessages);
              if (supabaseMessages.length > 0) {
                // Convert Supabase messages to local Message format
                const convertedMessages = supabaseMessages.map(msg => {
                  console.log("🔍 Processing message:", msg.id, "Images:", msg.images, "Metadata:", msg.metadata);
                  return {
                    id: msg.id,
                    content: msg.content,
                    role: msg.role, // Use role field from database (user/assistant)
                    timestamp: new Date(msg.created_at || msg.timestamp),
                    images: msg.images || [], // Use already processed images from chatHistoryService
                    videos: msg.videos || [], // Use already processed videos from chatHistoryService
                    isGenerating: false,
                    metadata: msg.metadata || {}
                  };
                });
                console.log("🔄 Converted messages:", convertedMessages);
                // Log messages with images specifically
                const messagesWithImages = convertedMessages.filter(msg => msg.images && msg.images.length > 0);
                console.log("🖼️ Messages with images:", messagesWithImages.length, messagesWithImages);
                console.log("📋 All messages loaded:", convertedMessages);
                console.log("🔍 Messages with images:", convertedMessages.filter(m => m.images && m.images.length > 0));
                setMessages(convertedMessages);
              } else {
                // Fresh session - reset to default message
                setMessages([
                  {
                    id: "1",
                    content: "What are we creating today?",
                    role: "assistant",
                    timestamp: new Date(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Failed to load session messages:', error);
              // Fallback to default message
              setMessages([
                {
                  id: "1",
                  content: "What are we creating today?",
                  role: "assistant",
                  timestamp: new Date(),
                },
              ]);
            } finally {
              setIsLoadingMessages(false);
            }
          } else {
            // Use existing session messages
            setMessages(session.messages);
          }
          
          // Mark this session as loaded
          setLoadedSessions(prev => new Set([...prev, sessionId]));
        
          // Restore session state to prevent loss on navigation
          if (session.uploadedImages && !externalUploadedImages) {
            setLocalUploadedImages(session.uploadedImages);
          } else if (!externalUploadedImages) {
            setLocalUploadedImages([]);
          }
          
          if (session.inputValue) {
            setInputValue(session.inputValue);
          } else {
            setInputValue("");
          }
        } else {
          // Session not found, navigate to home using React Router
          // This will be handled by the parent component navigation
          setMessages([
            {
              id: "1",
              content: "What are we creating today?",
              role: "assistant",
              timestamp: new Date(),
            },
          ]);
          if (!externalUploadedImages) {
            setLocalUploadedImages([]);
          }
          setInputValue("");
        }
      } else if (!currentSessionId && !sessionId) {
        // Only create a new session if we're on a chat path without a sessionId
        // This prevents creating sessions when we navigate to home after deleting
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/chat') && currentPath === '/chat') {
          const newSessionId = await createSession();
          window.history.replaceState(null, '', `/chat/${newSessionId}`);
        }
      }
    };

    loadSessionData();
  }, [sessionId, sessions]); // Removed loadedSessions and isLoadingMessages to prevent unnecessary re-runs

  // Save messages to session when they change
  useEffect(() => {
    if (sessionId && messages.length > 1) {
      console.log("💾 Updating session with messages:", { sessionId, messageCount: messages.length });
      
      // Get current session data without relying on sessions state to prevent loops
      const updates: any = { messages };
      
      // Only generate title for sessions without a meaningful title
      // We'll let the backend handle title generation to avoid dependency issues
      const firstUserMessage = messages.find(m => m.role === 'user')?.content;
      if (firstUserMessage && firstUserMessage.length > 0) {
        updates.title = generateSessionTitle(messages);
      }
      
      updateSession(sessionId, updates);
    }
  }, [messages, sessionId]); // Remove sessions to prevent infinite loop

  // Save input state to prevent loss on navigation (debounced to prevent flickering)
  useEffect(() => {
    if (currentSessionId && inputValue.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        // Only update if there's meaningful content to save
        const currentSession = sessions.find(s => s.id === currentSessionId);
        const hasChanges = currentSession?.inputValue !== inputValue || 
                          JSON.stringify(currentSession?.uploadedImages || []) !== JSON.stringify(externalUploadedImages || localUploadedImages);
        
        if (hasChanges) {
          updateSession(currentSessionId, {
            inputValue: inputValue,
            uploadedImages: externalUploadedImages || localUploadedImages
          });
        }
      }, 1000); // Increase debounce to 1 second to reduce API calls

      return () => clearTimeout(timeoutId);
    }
  }, [inputValue, localUploadedImages, externalUploadedImages, currentSessionId]); // Remove sessions to prevent infinite loop

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

  // Get 4 rotating prompts based on session ID or current time
  const getRotatingPrompts = () => {
    const seed = sessionId && typeof sessionId === 'string' ? sessionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Date.now();
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const [examplePrompts] = useState(() => getRotatingPrompts());

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  /**
   * Handle input changes and track user intent
   * If user clears text on Enhance Photo page, prevent auto-refilling
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // If user manually clears the text (and there are uploaded images), mark that they've cleared it
    if (showImageUpload && uploadedImages.length > 0 && newValue.trim() === "") {
      hasUserClearedText.current = true;
    }
  };


  const handleViewPrompts = () => {
    setPromptLibraryOpen(true);
  };


  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (uploadedImages.length > 0 ? "Uploaded image" : ""),
      role: "user",
      timestamp: new Date(),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
    };

    // Save user message to Supabase if we have a session and process images first
    let finalUserMessage = userMessage;
    
    if (sessionId && saveMessage) {
      try {
        console.log("💾 Saving user message to session:", sessionId);
        
        // Process and upload images to Cloudinary storage first
        const processedImages = [];
        if (uploadedImages.length > 0) {
          for (const img of uploadedImages) {
            try {
              let cloudinaryUrl = img.url;
              let cloudinaryPath = '';
              
              // If it's a blob URL or data URL, upload it to Cloudinary storage
              if (img.url.startsWith('blob:') || img.url.startsWith('data:')) {
                console.log("📤 Uploading image to Cloudinary storage:", img.name);
                
                const uploadedMedia = img.url.startsWith('blob:') 
                  ? await CloudinaryBrowserService.uploadFromBlobUrl(img.url, img.name, user)
                  : await CloudinaryBrowserService.uploadFromDataUrl(img.url, img.name, user);
                
                cloudinaryUrl = uploadedMedia.publicUrl;
                cloudinaryPath = uploadedMedia.publicId || '';
                console.log("✅ Image uploaded to Cloudinary:", cloudinaryUrl);
              }
              
              const processedImage = {
                id: img.id,
                name: img.name,
                url: cloudinaryUrl,
                size: img.size,
                type: img.type,
                is_generated: false, // User uploaded images are not AI generated
                cloudinaryPath: cloudinaryPath,
                fileSize: img.size || 0
              };
              
              processedImages.push(processedImage);
            } catch (uploadError) {
              console.error("❌ Failed to upload image:", uploadError);
              // Use original URL as fallback
              processedImages.push({
                id: img.id,
                name: img.name,
                url: img.url,
                size: img.size,
                type: img.type,
                is_generated: false,
                cloudinaryPath: '',
                fileSize: img.size || 0
              });
            }
          }
          
          // Update the uploaded images state with Cloudinary URLs
          if (processedImages.length > 0) {
            setUploadedImages(processedImages);
          }
        }
        
        // Enhanced user message with processed image information
        finalUserMessage = {
          ...userMessage,
          images: processedImages.length > 0 ? processedImages : undefined
        };
        
        await saveMessage(sessionId, finalUserMessage);
        console.log("✅ User message saved successfully");
      } catch (error) {
        console.error("❌ Failed to save user message:", error);
        // Continue with the flow even if saving fails
      }
    } else {
      console.log("⚠️ No session ID or saveMessage function available", { sessionId, hasSaveMessage: !!saveMessage });
    }
    
    // Add user message to UI with processed images
    const newMessages = [...messages, finalUserMessage];
    setMessages(newMessages);
    
    const currentInput = inputValue;
    const currentImages = [...uploadedImages];
    
    // Clear input immediately and update session synchronously
    setInputValue("");
    
    // Use setTimeout to ensure the state update happens before session update
    setTimeout(() => {
      if (currentSessionId) {
        updateSession(currentSessionId, {
          inputValue: "",
          uploadedImages: externalUploadedImages || localUploadedImages
        });
      }
    }, 0);
    
    // Keep images visible for subsequent prompts - don't clear them
    // setUploadedImages([]);  // Removed: This was clearing images after first use

    try {
      // For image uploads, directly trigger image generation without chat AI
      if (currentImages.length > 0 && showImageUpload) {
        // Add a generating message with shimmer effect
        const generatingMessageId = (Date.now() + 1).toString();
        const generatingMessage: Message = {
          id: generatingMessageId,
          content: "🎨 Generating your image now...",
          role: "assistant",
          timestamp: new Date(),
          isGenerating: true,
        };

        setMessages((prev) => [...prev, generatingMessage]);

        // Mark session as completed when generating image
        if (currentSessionId) {
          updateSession(currentSessionId, { isCompleted: true });
        }
        
        // Trigger image generation directly
        try {
          // Only generate if user provided a prompt
          if (currentInput.trim()) {
            await onGenerateImage(currentInput, currentImages);
          }
          // Remove the generating message after image generation completes
          setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
        } catch (error) {
          // Remove generating message even if there's an error
          setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
          console.error("Image generation error:", error);
        }
        return; // Exit early, don't call chat AI
      }

      // Call the real AI chat API for text-only messages
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

      // Save assistant message to Supabase if we have a session
      if (sessionId && saveMessage) {
        try {
          console.log("💾 Saving assistant message to session:", sessionId);
          
          // Find the corresponding user message to link as parent
          const lastUserMessage = newMessages.filter(msg => msg.role === 'user').pop();
          
          // Enhanced assistant message with conversation context
          const enhancedAssistantMessage = {
            ...assistantMessage,
            conversation_context: {
              prompt: currentInput,
              intent: intent,
              image_prompt: imagePrompt,
              model_used: 'gemini-1.5-flash',
            },
            parent_message_id: lastUserMessage?.id
          };
          
          await saveMessage(sessionId, enhancedAssistantMessage);
          console.log("✅ Assistant message saved successfully");
        } catch (error) {
          console.error("❌ Failed to save assistant message:", error);
          // Continue with the flow even if saving fails
        }
      } else {
        console.log("⚠️ No session ID or saveMessage function available for assistant message", { sessionId, hasSaveMessage: !!saveMessage });
      }

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
          
          // Wait a moment for the generated image to be available in props
          setTimeout(async () => {
            // After image generation, check if we have a generated image to add to messages
            if (generatedImage) {
              let finalImageUrl = generatedImage;
              
              // If the generated image is a data URL, upload it to Cloudinary storage
              if (generatedImage.startsWith('data:') && user) {
                try {
                  console.log("📤 Uploading generated image to Cloudinary storage");
                  const fileName = `generated-image-${Date.now()}.png`;
                  const uploadedMedia = await CloudinaryBrowserService.uploadFromDataUrl(
                    generatedImage, 
                    fileName, 
                    user,
                    { is_generated: true, prompt_used: imagePrompt || currentInput }
                  );
                  finalImageUrl = uploadedMedia.publicUrl;
                  console.log("✅ Generated image uploaded to Cloudinary:", finalImageUrl);
                } catch (uploadError) {
                  console.error("❌ Failed to upload generated image to Cloudinary:", uploadError);
                  // Continue with data URL as fallback
                }
              }
              
              const imageMessage: Message = {
                id: (Date.now() + 2).toString(),
                content: "Here's your generated image:",
                role: "assistant",
                timestamp: new Date(),
                images: [{
                  id: `generated-${Date.now()}`,
                  name: `generated-image-${Date.now()}.png`,
                  url: finalImageUrl,
                  size: 0,
                  type: 'image/png',
                  is_generated: true
                }]
              };
              
              // Remove the generating message and add the image message
              setMessages((prev) => [...prev.filter(msg => msg.id !== generatingMessageId), imageMessage]);
              
              // Save the image message to database if we have a session
              if (sessionId && saveMessage) {
                try {
                  console.log("💾 Saving generated image message to session:", sessionId);
                  await saveMessage(sessionId, imageMessage);
                  console.log("✅ Generated image message saved successfully");
                } catch (error) {
                  console.error("❌ Failed to save generated image message:", error);
                }
              }
            } else {
              // Just remove the generating message if no image was generated
              setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
            }
          }, 1000); // Wait 1 second for the image to be available
        } catch (error) {
          // Remove generating message even if there's an error
          setMessages((prev) => prev.filter(msg => msg.id !== generatingMessageId));
        }
      }

    } catch (error) {
      const appError = handleError(error, 'Chat AI');
      
      // Determine appropriate error message based on error type
      let errorContent = "I'm having trouble responding right now. Please try again.";
      
      if (appError instanceof NetworkError) {
        errorContent = "I can't connect right now. Please check your internet connection and try again.";
      } else if (appError.code === 'AUTH_ERROR') {
        errorContent = "Please sign in to continue our conversation.";
      }
      
      // Fallback error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorContent,
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
    <div className="flex flex-col h-full relative">
      {/* New Chat Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleNewChat}
          variant="outline"
          size="sm"
          className="h-9 w-9 rounded-full p-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full minimal-scroll" ref={scrollAreaRef}>
          <div className="w-full px-4 py-6 pb-4 md:px-6 md:py-8 md:pb-32">
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
                          {message.images.map((img) => {
                            console.log('Rendering image:', {
                              id: img.id,
                              url: img.url,
                              name: img.name,
                              alt: img.alt
                            });
                            return (
                              <div key={img.id} className="relative">
                                <img
                                  src={img.url}
                                  alt={img.alt || img.name || 'Image'}
                                  className="w-32 h-32 object-cover rounded-lg border border-border"
                                  onError={(e) => {
                                    console.error('Image failed to load:', {
                                      url: img.url,
                                      error: e,
                                      target: e.target
                                    });
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully:', img.url);
                                  }}
                                />
                              </div>
                            );
                          })}
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
      </div>

      {/* Input Area at bottom */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] flex-shrink-0">
        <div className="w-full px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-3xl mx-auto">
            {/* Route Guide - Minimal and Modern */}
            <div className="mb-4 transition-all duration-300" style={{ height: (messages.length <= 1 || uploadedImages.length > 0) && (uploadedImages.length === 0 || showImageUpload || uploadedImages.length > 0) ? 'auto' : '0', overflow: 'hidden' }}>
              {/* Simple image upload for Enhance page - no extra UI */}
              {showImageUpload && (
                <div className="mb-3">
                  <ImageUpload
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    maxImages={1}
                    showPreview={true}
                  />
                </div>
              )}
              
              {/* Chat flow image upload */}
              {!showImageUpload && (messages.length <= 1 || uploadedImages.length > 0) && (
                <div className="mb-3">
                  <ImageUpload
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    maxImages={5}
                    showPreview={true}
                  />
                </div>
              )}
           </div>

           {/* Example Prompts - Flexible Fill */}
           {showPrompts && (
             <div className="mb-3 transition-all duration-300" style={{ height: messages.length <= 1 && uploadedImages.length === 0 ? 'auto' : '0', overflow: 'hidden' }}>
               {messages.length <= 1 && uploadedImages.length === 0 && (
                 <div className="animate-fade-in">
                   <div className="flex items-center gap-3 w-full">
                     {/* 3 Example Prompts - Flexible sizing */}
                     {examplePrompts.slice(0, 3).map((prompt, index) => (
                       <button
                         key={index}
                         onClick={() => handlePromptClick(prompt)}
                         className="text-xs px-3 py-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap flex-1 min-w-0 overflow-hidden text-ellipsis"
                       >
                         {prompt}
                       </button>
                     ))}
                     
                     {/* View All Prompts Button - Fixed width */}
                     <button
                       onClick={handleViewPrompts}
                       className="text-xs px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors whitespace-nowrap flex-shrink-0 font-medium"
                     >
                       View all prompts →
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Uploaded Images Preview - Read-only display (only show when not using ImageUpload component) */}
           {uploadedImages.length > 0 && !showImageUpload && (
             <div className="mb-4">
               <div className="flex flex-wrap gap-2 mb-3">
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
                           const newImages = uploadedImages.filter(img => img.id !== image.id);
                           setUploadedImages(newImages);
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
               
               {/* Removed Step 2 transformation suggestions - keeping interface minimal */}
             </div>
           )}

           {/* Input Row */}
           <div className="flex items-end gap-3">
             <div className="flex-1">
               <div className="relative">
                 <Input
                   value={inputValue}
                   onChange={handleInputChange}
                   onKeyPress={handleKeyPress}
                   placeholder="Type your prompt here..."
                   disabled={showImageUpload && uploadedImages.length === 0 && messages.length <= 1}
                   className={`w-full h-12 bg-transparent border border-[hsl(var(--border))] rounded-full pl-4 pr-6 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[hsl(var(--border))] hover:border-[hsl(var(--border))] resize-none min-h-[48px] max-h-[48px] ${showImageUpload && uploadedImages.length === 0 && messages.length <= 1 ? 'opacity-50 cursor-not-allowed bg-muted/30' : ''}`}
                 />
               </div>
             </div>
             <Button 
               onClick={handleSendMessage}
               disabled={!inputValue.trim() && uploadedImages.length === 0 || (showImageUpload && uploadedImages.length === 0 && messages.length <= 1)}
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