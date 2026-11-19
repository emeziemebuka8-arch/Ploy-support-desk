"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Save } from "lucide-react";
import { CATEGORIES, PRIORITIES, SOURCES } from "@/lib/constants";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import Button, { buttonClass } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Empty form values, also used to reset the form. */
const emptyValues = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  subject: "",
  description: "",
  category_id: "",
  priority: "",
  source: "",
};

/**
 * TicketForm
 * ---------------------------------------------------------------
 * One form is used for both "New Ticket" and "Edit Ticket" so the
 * fields, validation and styling stay identical.
 *
 * Props:
 * - initialValues: values to start with (edit page passes the ticket)
 * - submitLabel: text on the main button
 * - cancelHref: where the Cancel button goes
 * - onSubmit: called with the validated values
 */
export default function TicketForm({
  initialValues = emptyValues,
  submitLabel = "Create Ticket",
  cancelHref = "/tickets",
  onSubmit,
}) {
  const [values, setValues] = useState({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Update one field and clear its error. */
  function updateField(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  /** Check the required fields before saving. */
  function validate() {
    const nextErrors = {};

    if (!values.customer_name.trim()) {
      nextErrors.customer_name = "Customer name is required.";
    }
    if (!values.subject.trim()) {
      nextErrors.subject = "Complaint subject is required.";
    }
    if (!values.description.trim()) {
      nextErrors.description = "Complaint description is required.";
    }
    if (!values.category_id) {
      nextErrors.category_id = "Please choose a category.";
    }
    if (!values.priority) {
      nextErrors.priority = "Please choose a priority.";
    }
    if (!values.source) {
      nextErrors.source = "Please choose a source.";
    }
    // The email is required by the database and is how the customer
    // tracks the complaint. The phone number is optional.
    if (!values.customer_email.trim()) {
      nextErrors.customer_email = "Customer email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(values.customer_email)) {
      nextErrors.customer_email = "Enter a valid email address.";
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

    try {
      setSubmitting(true);
      await onSubmit(values);
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      {/* Customer information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Who reported the problem? The name and email are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
              placeholder="e.g. Amina Bello"
            />
          </Field>

          <Field
            label="Email Address"
            htmlFor="customer_email"
            required
            error={errors.customer_email}
            hint="The customer uses this address to track the complaint."
          >
            <Input
              id="customer_email"
              type="email"
              value={values.customer_email}
              onChange={(event) =>
                updateField("customer_email", event.target.value)
              }
              placeholder="e.g. amina@example.com"
            />
          </Field>

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
            />
          </Field>
        </CardContent>
      </Card>

      {/* Complaint information */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Information</CardTitle>
          <CardDescription>
            Record what the customer reported and how urgent it is.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="e.g. WhatsApp messages are not delivering"
            />
          </Field>

          <Field
            label="Complaint Description"
            htmlFor="description"
            required
            error={errors.description}
            hint="Write the complaint in the customer's own words where possible."
          >
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the problem, when it started and what has been tried."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Category"
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
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Priority"
              htmlFor="priority"
              required
              error={errors.priority}
            >
              <Select
                id="priority"
                value={values.priority}
                onChange={(event) => updateField("priority", event.target.value)}
              >
                <option value="">Select priority</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Source of Complaint"
              htmlFor="source"
              required
              error={errors.source}
            >
              <Select
                id="source"
                value={values.source}
                onChange={(event) => updateField("source", event.target.value)}
              >
                <option value="">Select source</option>
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className={buttonClass({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
