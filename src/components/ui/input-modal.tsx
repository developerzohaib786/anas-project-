import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function InputModal({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue = "",
  onConfirm,
  onCancel,
  confirmText = "Add",
  cancelText = "Cancel"
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      setValue("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setValue("");
    onOpenChange(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            className="border-border/50 focus:border-primary rounded-xl h-11 px-4 bg-background/50"
            autoFocus
          />
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 rounded-xl h-11 border-border/50 hover:bg-muted/50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!value.trim()}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}