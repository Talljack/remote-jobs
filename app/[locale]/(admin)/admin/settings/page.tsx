"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure system-wide settings and crawler configurations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center text-muted-foreground">
          <p>Settings page coming soon...</p>
          <p className="mt-2 text-sm">
            This page will allow you to configure crawler schedules, email notifications, and other
            system settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
