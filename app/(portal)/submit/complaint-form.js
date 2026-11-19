"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Send } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import Button, { buttonClass } from "@/components/ui/button";

/**
 * The public complaint form.
 *
 * The browser checks the fields first so the customer gets an instant
 * message, then the server checks them again because a browser check can
 * always be bypassed.
 *
 * The form never talks to Supabase directly. It sends a request to our own
 * /api/complaints endpoint, which is where the complaint is saved.
 */

const emptyValues = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  subject: "",
  description: "",
  category_id: "",
};

export default function ComplaintForm() {
  const router = useRouter();
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {};

    if (!values.customer_name.trim()) {
      nextErrors.customer_name = "Please enter your name.";
    }
    if (!values.customer_email.trim()) {
      nextErrors.customer_email = "Please enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(values.customer_email.trim())) {
      nextErrors.customer_email = "Enter a valid email address.";
    }
    if (!values.subject.trim()) {
      nextErrors.subject = "Please enter a short subject.";
    }
    if (!values.description.trim()) {
      nextErrors.description = "Please describe the problem.";
    }
    if (!values.category_id) {
      nextErrors.category_id = "Please choose a category.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          // Hidden field used to catch simple spam bots.
          website: event.target.website.value,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/confirmation?ticket=${encodeURIComponent(data.ticket_number)}`);
    } catch {
      setFormError(
        "We could not send your complaint. Check your connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Customer Name"
              htmlFor="customer_name"
              required
              error={errors.customer_name}
            >
              <Input
                id="customer_name"
                value={values.customer_name}
                onChange={(event) =>
                  updateField("customer_name", event.target.value)
                }
                placeholder="Your full name"
                maxLength={120}
                autoComplete="name"
              />
            </Field>

            <Field
              label="Email Address"
              htmlFor="customer_email"
              required
              error={errors.customer_email}
              hint="Used to look up your complaint."
            >
              <Input
                id="customer_email"
                type="email"
                value={values.customer_email}
                onChange={(event) =>
                  updateField("customer_email", event.target.value)
                }
                placeholder="you@example.com"
                maxLength={200}
                autoComplete="email"
              />
            </Field>
          </div>

          <Field
            label="Phone Number"
            htmlFor="customer_phone"
            hint="Optional"
            error={errors.customer_phone}
          >
            <Input
              id="customer_phone"
              value={values.customer_phone}
              onChange={(event) =>
                updateField("customer_phone", event.target.value)
              }
              placeholder="e.g. 0803 555 0182"
              maxLength={40}
              autoComplete="tel"
            />
          </Field>

          {/* Spam trap: real customers never see or fill this. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <Field
            label="Complaint Subject"
            htmlFor="subject"
            required
            error={errors.subject}
          >
            <Input
              id="subject"
              value={values.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="A short summary, e.g. Payment failed but I was debited"
              maxLength={200}
            />
          </Field>

          <Field
            label="Complaint Category"
            htmlFor="category_id"
            required
            error={errors.category_id}
          >
            <Select
              id="category_id"
              value={values.category_id}
              onChange={(event) =>
                updateField("category_id", event.target.value)
              }
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Complaint Description"
            htmlFor="description"
            required
            error={errors.description}
            hint="Tell us what happened, when it started and what you have tried."
          >
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the problem in your own words."
              maxLength={5000}
            />
          </Field>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Your complaint is recorded with the source &ldquo;Website&rdquo;. We
        only use these details to handle your complaint.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={submitting}>
          <Send className="h-4 w-4" />
          {submitting ? "Submitting..." : "Submit Complaint"}
        </Button>
      </div>
    </form>
  );
}
