import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BrandNameModalProps {
  open: boolean;
  onSave: (brandName: string) => void;
}

export const BrandNameModal = ({ open, onSave }: BrandNameModalProps) => {
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!brandName.trim()) return;
    
    setLoading(true);
    try {
      await onSave(brandName.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-center">
            What's your brand name?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name" className="text-base font-medium">
              Brand Name
            </Label>
            <Input
              id="brand-name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name"
              className="h-12 text-base"
              autoFocus
            />
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={!brandName.trim() || loading}
            className="w-full h-12 text-base font-medium"
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};