import { useState, useEffect, useCallback, useRef } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoPreview } from "@/components/VideoPreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Video as VideoIcon } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage, VideoSize } from "@/types/common";
import { useSmartSession } from "@/hooks/useSmartSession";
import { imageGenerationRateLimiter } from "@/lib/rate-limiter";
import { handleError } from "@/lib/error-handler";
import { supabase } from "@/integrations/supabase/client";

// This is a clean header - copy the rest from the corrupted file