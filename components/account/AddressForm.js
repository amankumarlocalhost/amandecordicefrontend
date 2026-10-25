"use client";

import { useState } from "react";
import { Field, fieldErrorsFrom, validators } from "@/components/forms/Field";
import { Notice, Spinner } from "@/components/ui/bits";
import { addressApi, catalogApi } from "@/lib/api/endpoints";
import { useAuth } from "@/components/providers/AuthProvider";

export const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", type: "home", isDefault: false };

export default function AddressForm({ address, onSaved, onCancel, submitLabel = "Save address" }) {
  const { user } = useAuth();
  const [f, setF] = useState(() => ({ ...EMPTY, fullName: user?.name || "", ...(address || {}), phone: (address?.phone || user?.phone || "").replace(/^\+91/, "") }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pinInfo, setPinInfo] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const lookupPin = async (pin) => {
    if (!/^[1-9]\d{5}$/.test(pin)) return setPinInfo(null);
    try {
      const r = await catalogApi.serviceability(pin);
      setPinInfo(r.data);
      if (r.data.city || r.data.state) setF((x) => ({ ...x, city: x.city || r.data.city || "", state: x.state || r.data.state || "" }));
    } catch {
      setPinInfo(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {
      fullName: f.fullName.trim().length < 2 ? "Enter the recipient's name" : null,
      phone: validators.phone(f.phone),
      line1: f.line1.trim().length < 3 ? "Enter house / flat and street" : null,
      city: f.city.trim().length < 2 ? "Enter city" : null,
      state: !f.state ? "Choose a state" : null,
      pincode: validators.pincode(f.pincode),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setError(null);
    const body = { fullName: f.fullName.trim(), phone: f.phone, line1: f.line1.trim(), line2: f.line2?.trim() || undefined, landmark: f.landmark?.trim() || undefined, city: f.city.trim(), state: f.state, pincode: f.pincode, type: f.type, isDefault: Boolean(f.isDefault) };
    try {
      const r = address?._id ? await addressApi.update(address._id, body) : await addressApi.create(body);
      onSaved?.(r.data);
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Full name" value={f.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
      <Field label="Mobile number" type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
      <Field className="sm:col-span-2" label="House / flat, street" value={f.line1} onChange={set("line1")} error={errors.line1} autoComplete="address-line1" />
      <Field className="sm:col-span-2" label="Area, locality (optional)" value={f.line2 || ""} onChange={set("line2")} autoComplete="address-line2" />
      <Field label="Landmark (optional)" value={f.landmark || ""} onChange={set("landmark")} />
      <Field
        label="PIN code"
        value={f.pincode}
        inputMode="numeric"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          setF((x) => ({ ...x, pincode: v }));
          if (v.length === 6) lookupPin(v);
        }}
        error={errors.pincode}
        autoComplete="postal-code"
        hint={pinInfo ? (pinInfo.serviceable ? `Delivers in ~${pinInfo.estimatedDays} days${pinInfo.codAvailable ? " · COD available" : ""}` : "We don't deliver here yet") : undefined}
      />
      <Field label="City" value={f.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
      <div>
        <label htmlFor="addr-state" className="field-label">State</label>
        <select id="addr-state" className="input" value={f.state} onChange={set("state")} aria-invalid={errors.state ? "true" : undefined} autoComplete="address-level1">
          <option value="">Select state</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state ? <p className="field-error">{errors.state}</p> : null}
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="field-label">Address type</legend>
        <div className="flex gap-2">
          {["home", "work", "other"].map((t) => (
            <label key={t} className={`chip cursor-pointer px-4 py-1.5 capitalize ${f.type === t ? "border-olive-900 bg-olive-900 text-cream-50" : ""}`}>
              <input type="radio" name="addr-type" value={t} checked={f.type === t} onChange={set("type")} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
        <input type="checkbox" checked={Boolean(f.isDefault)} onChange={set("isDefault")} className="h-4 w-4 accent-[var(--olive-800)]" /> Make this my default address
      </label>
      {error ? <Notice tone="error" className="sm:col-span-2">{error}</Notice> : null}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner size={16} /> : null} {submitLabel}</button>
        {onCancel ? <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button> : null}
      </div>
    </form>
  );
}
