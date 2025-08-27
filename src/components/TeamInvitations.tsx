import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Mail, Users, Crown, Shield, User } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  invitation_accepted: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface TeamInvitationsProps {
  teamId: string;
}

export function TeamInvitations({ teamId }: TeamInvitationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      // Load team members with their profile info
      const { data: membersData } = await supabase
        .from('team_memberships')
        .select(`
          id,
          user_id,
          role,
          invitation_accepted
        `)
        .eq('team_id', teamId)
        .eq('invitation_accepted', true);

      // Get profile data separately to avoid join issues
      const membersWithProfiles = [];
      if (membersData) {
        for (const member of membersData) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', member.user_id)
            .single();
          
          membersWithProfiles.push({
            ...member,
            profiles: profile || { first_name: '', last_name: '', email: '' }
          });
        }
      }

      // Load pending invitations
      const { data: invitationsData } = await supabase
        .from('team_invitations')
        .select('id, email, role, created_at')
        .eq('team_id', teamId)
        .is('accepted_at', null);

      setMembers(membersWithProfiles || []);
      setPendingInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error loading team data:', error);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Invitation failed",
            description: "This user has already been invited to this team.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Invitation sent!",
          description: `Invitation sent to ${email}`,
        });
        setEmail("");
        setRole("member");
        loadTeamData();
      }
    } catch (error: any) {
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Members
          </CardTitle>
          <CardDescription>
            Invite new members to collaborate on your creative projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="rounded-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
          <CardDescription>
            Manage your team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.profiles?.first_name?.[0]}{member.profiles?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </p>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                  {getRoleIcon(member.role)}
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    {getRoleIcon(invitation.role)}
                    {invitation.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}