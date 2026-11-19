"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, LifeBuoy, LogIn } from "lucide-react";
import Button from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Product name */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">
            Ploy Support Desk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage customer complaints.
          </p>
        </div>

        <Card className="p-6">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
              </div>
            )}

            <Field label="Email Address" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@ploy.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            <Button type="submit" className="w-full" disabled={pending}>
              <LogIn className="h-4 w-4" />
              {pending ? "Signing in..." : "Login"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          Use the administrator account created in your Supabase project.
        </p>
      </div>
    </div>
  );
}
