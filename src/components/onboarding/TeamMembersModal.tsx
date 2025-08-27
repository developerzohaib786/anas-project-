import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  email: string;
  name: string;
}

interface TeamMembersModalProps {
  open: boolean;
  onSave: (members: TeamMember[]) => void;
  onSkip: () => void;
}

export const TeamMembersModal = ({ open, onSave, onSkip }: TeamMembersModalProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    if (!currentEmail.trim() || !currentName.trim()) return;
    
    const newMember = {
      email: currentEmail.trim(),
      name: currentName.trim()
    };
    
    setMembers([...members, newMember]);
    setCurrentEmail("");
    setCurrentName("");
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(members);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await onSkip();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-center">
            Invite your team
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="member-name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="member-name"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="Full name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="member-email"
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-11"
                />
              </div>
            </div>
            
            <Button 
              onClick={addMember}
              disabled={!currentEmail.trim() || !currentName.trim()}
              variant="outline"
              className="w-full h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          {members.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Team Members ({members.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                    <Button
                      onClick={() => removeMember(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSkip}
              variant="outline"
              disabled={loading}
              className="flex-1 h-12"
            >
              Skip for now
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 h-12"
            >
              {loading ? "Saving..." : members.length > 0 ? "Invite team" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};