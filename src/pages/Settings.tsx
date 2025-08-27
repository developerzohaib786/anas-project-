import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="Enter your first name" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Enter your last name" className="mt-2" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="Enter your email" className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">This email will be used for account notifications</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter your phone number" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-email">Email Notifications</Label>
              <Input 
                id="notification-email" 
                placeholder="Receive updates about your projects and account" 
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="marketing-emails">Marketing Communications</Label>
              <Input 
                id="marketing-emails" 
                placeholder="Product updates, tips, and feature announcements" 
                className="mt-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button style={{ boxShadow: 'var(--shadow-button)' }}>
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}