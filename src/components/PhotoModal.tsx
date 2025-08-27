import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    thumbnail: string;
    category: string;
    created: string;
  } | null;
}

export function PhotoModal({ isOpen, onClose, project }: PhotoModalProps) {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-transparent border-0 shadow-none">
        <div className="relative h-full w-full flex items-center justify-center">
          {/* Close button */}
          <Button
            onClick={onClose}
            size="icon"
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/70 hover:bg-black/80 text-white border-0 backdrop-blur-sm transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Download button */}
          <Button
            size="icon"
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/70 hover:bg-black/80 text-white border-0 backdrop-blur-sm transition-all duration-200"
          >
            <Download className="h-5 w-5" />
          </Button>

          {/* Photo container */}
          <div 
            className="relative max-w-full max-h-full bg-white rounded-3xl overflow-hidden animate-scale-in"
            style={{
              boxShadow: 'var(--shadow-floating)'
            }}
          >
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-auto max-h-[80vh] object-contain"
              loading="lazy"
            />
            
            {/* Photo info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              <div className="text-white">
                <h2 className="text-xl font-medium mb-2">{project.name}</h2>
                <div className="flex items-center justify-between text-sm opacity-90">
                  <span>{project.category}</span>
                  <span>{project.created}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-md -z-10"
            onClick={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}