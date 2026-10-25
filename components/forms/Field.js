"use client";

import { useId, useState } from "react";
import Icon from "@/components/ui/Icon";

export function Field({ label, error, hint, className = "", textarea = false, type = "text", ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const Comp = textarea ? "textarea" : "input";
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <Comp
          id={id}
          type={isPassword && show ? "text" : type}
          className={`input ${textarea ? "min-h-24" : ""} ${isPassword ? "pr-11" : ""}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          {...props}
        />
        {isPassword ? (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 px-1.5 text-[0.65rem] tracking-[0.12em] text-muted uppercase hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-e`} className="field-error flex items-center gap-1">
          <Icon name="alert" size={13} /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const validators = {
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : "Enter a valid email address"),
  phone: (v) => (/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")) ? null : "Enter a valid 10-digit Indian mobile number"),
  password: (v) => (v.length < 8 ? "At least 8 characters" : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? "Use letters and numbers" : null),
  required: (label) => (v) => (String(v ?? "").trim() ? null : `${label} is required`),
  pincode: (v) => (/^[1-9]\d{5}$/.test(v) ? null : "Enter a valid 6-digit PIN code"),
};

/** Maps backend VALIDATION_ERROR details onto field names when present. */
export function fieldErrorsFrom(err) {
  const out = {};
  const issues = err?.details?.issues || err?.details;
  if (Array.isArray(issues)) {
    for (const i of issues) {
      const key = String(Array.isArray(i.path) ? i.path.join(".") : i.path || "").split(".").pop();
      if (key && !out[key]) out[key] = i.message;
    }
  }
  return out;
}
