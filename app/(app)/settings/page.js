"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LogOut, Save } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { admin, updateAdminName } = useTickets();
  const [fullName, setFullName] = useState(admin.full_name);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    if (!fullName.trim() || saving) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await updateAdminName(fullName);
      setSaved(true);
    } catch (failure) {
      setError(failure?.message || "Your name could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">
          Your administrator account details.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your display name has been updated.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Administrator Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full Name" htmlFor="full_name" required>
              <Input
                id="full_name"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setSaved(false);
                  setError("");
                }}
                placeholder="Your full name"
              />
            </Field>

            <Field
              label="Email Address"
              htmlFor="email"
              hint="The email used to sign in cannot be changed here."
            >
              <Input id="email" value={admin.email} disabled />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={!fullName.trim() || saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Sign out of the support desk on this device.
          </p>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
