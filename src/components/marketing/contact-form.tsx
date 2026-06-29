"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send message.");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="air-card air-card-pad" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="air-label">
            Your name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            className="air-input"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="air-label">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
            className="air-input"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="air-label">
            Message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            className="air-textarea"
            required
          />
        </div>
      </div>

      {error && <p className="air-alert-error mt-4">{error}</p>}
      {success && (
        <p className="mt-4 rounded-2xl border border-emerald-brand/30 bg-emerald-brand-light/40 px-4 py-3 text-sm text-emerald-brand-dark">
          Thanks — we received your message and will reply within 24 hours.
        </p>
      )}

      <Button type="submit" variant="primary" className="mt-6 w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
