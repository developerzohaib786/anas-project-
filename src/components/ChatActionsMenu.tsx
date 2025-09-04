import { useState } from "react";
import { MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ChatActionsMenuProps {
  sessionId: string;
  sessionTitle: string;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, newTitle: string) => void;
}

export function ChatActionsMenu({ 
  sessionId, 
  sessionTitle, 
  onDelete, 
  onRename 
}: ChatActionsMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(sessionTitle);
  const [isOpen, setIsOpen] = useState(false);

  const handleRename = () => {
    if (newTitle.trim() && newTitle.trim() !== sessionTitle) {
      onRename(sessionId, newTitle.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(sessionId);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewTitle(sessionTitle);
      setIsOpen(false);
    }
  };

  if (isRenaming) {
    return (
      <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center px-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleRename}
          className="h-8 text-sm border-0 bg-background"
          autoFocus
          placeholder="Chat title..."
        />
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted rounded"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsRenaming(true);
            setIsOpen(false);
          }}
          className="flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Rename chat
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}