"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { Drawer } from "@/components/ui/Overlay";
import { Spinner } from "@/components/ui/bits";
import { SORTS, TOGGLES, activeFilterCount, toSearch } from "@/lib/catalogQuery";
import { humanize, materialLabel } from "@/lib/format";

function useNavigate(basePath) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (next) => start(() => router.push(`${basePath}${toSearch({ ...next, page: undefined })}`, { scroll: false }));
  return { go, pending };
}

function Group({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left text-[0.68rem] font-medium tracking-[0.18em] uppercase" aria-expanded={open}>
        {title}
        <Icon name={open ? "minus" : "plus"} size={14} />
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function CheckList({ options, selected = [], onToggle, format = (v) => humanize(v) }) {
  const [all, setAll] = useState(false);
  const shown = all ? options : options.slice(0, 7);
  return (
    <ul className="space-y-2">
      {shown.map((o) => {
        const value = String(o.value).toLowerCase();
        const checked = selected.includes(value);
        return (
          <li key={value}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
              <input type="checkbox" checked={checked} onChange={() => onToggle(value)} className="h-4 w-4 accent-[var(--olive-800)]" />
              <span className="flex-1">{format(o.value)}</span>
              <span className="text-xs text-muted">{o.count}</span>
            </label>
          </li>
        );
      })}
      {options.length > 7 ? (
        <li>
          <button type="button" onClick={() => setAll((a) => !a)} className="text-xs text-olive-800 underline underline-offset-4">
            {all ? "Show less" : `Show all ${options.length}`}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

function PriceRange({ filters, facets, onApply }) {
  const [min, setMin] = useState(filters.minPrice ?? "");
  const [max, setMax] = useState(filters.maxPrice ?? "");
  const range = facets?.price;
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(min === "" ? undefined : Number(min), max === "" ? undefined : Number(max));
      }}
    >
      <label className="flex-1 text-xs text-muted">
        Min ₹
        <input type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder={range ? String(Math.floor(range.min / 100)) : "0"} className="input mt-1 min-h-9 px-2 py-1 text-sm" />
      </label>
      <label className="flex-1 text-xs text-muted">
        Max ₹
        <input type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder={range ? String(Math.ceil(range.max / 100)) : ""} className="input mt-1 min-h-9 px-2 py-1 text-sm" />
      </label>
      <button type="submit" className="btn btn-outline btn-sm min-h-9">Go</button>
    </form>
  );
}

function CapacityRange({ filters, onApply }) {
  const [min, setMin] = useState(filters.minCapacityMl ?? "");
  const [max, setMax] = useState(filters.maxCapacityMl ?? "");
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(min === "" ? undefined : Number(min), max === "" ? undefined : Number(max));
      }}
    >
      <label className="flex-1 text-xs text-muted">
        Min ml
        <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} className="input mt-1 min-h-9 px-2 py-1 text-sm" />
      </label>
      <label className="flex-1 text-xs text-muted">
        Max ml
        <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} className="input mt-1 min-h-9 px-2 py-1 text-sm" />
      </label>
      <button type="submit" className="btn btn-outline btn-sm min-h-9">Go</button>
    </form>
  );
}

function FilterBody({ filters, facets, go }) {
  const toggleIn = (key, value) => {
    const cur = filters[key] || [];
    go({ ...filters, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };
  return (
    <div>
      <Group title="Availability & offers">
        <ul className="space-y-2">
          {TOGGLES.map((t) => (
            <li key={t.key}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
                <input type="checkbox" checked={Boolean(filters[t.key])} onChange={() => go({ ...filters, [t.key]: !filters[t.key] || undefined })} className="h-4 w-4 accent-[var(--olive-800)]" />
                {t.label}
              </label>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="Price">
        <PriceRange key={`${filters.minPrice}-${filters.maxPrice}`} filters={filters} facets={facets} onApply={(minPrice, maxPrice) => go({ ...filters, minPrice, maxPrice })} />
      </Group>
      {facets?.materials?.length ? (
        <Group title="Material">
          <CheckList options={facets.materials} selected={filters.material} onToggle={(v) => toggleIn("material", v)} format={materialLabel} />
        </Group>
      ) : null}
      {facets?.colors?.length ? (
        <Group title="Colour & pattern">
          <CheckList options={facets.colors} selected={filters.color} onToggle={(v) => toggleIn("color", v)} />
        </Group>
      ) : null}
      {facets?.setSizes?.length ? (
        <Group title="Pieces in set">
          <div className="flex flex-wrap gap-2">
            {facets.setSizes.map((s) => (
              <button key={s.value} type="button" onClick={() => go({ ...filters, setSize: filters.setSize === s.value ? undefined : s.value })} className={`chip ${filters.setSize === s.value ? "border-olive-900 bg-olive-900 text-cream-50" : "hover:border-ink"}`} aria-pressed={filters.setSize === s.value}>
                {s.value} pcs <span className="opacity-60">({s.count})</span>
              </button>
            ))}
          </div>
        </Group>
      ) : null}
      <Group title="Capacity" defaultOpen={Boolean(filters.minCapacityMl || filters.maxCapacityMl)}>
        <CapacityRange key={`${filters.minCapacityMl}-${filters.maxCapacityMl}`} filters={filters} onApply={(minCapacityMl, maxCapacityMl) => go({ ...filters, minCapacityMl, maxCapacityMl })} />
      </Group>
      {facets?.brands?.length ? (
        <Group title="Brand" defaultOpen={false}>
          <CheckList options={facets.brands} selected={filters.brand} onToggle={(v) => toggleIn("brand", v)} format={(v) => v} />
        </Group>
      ) : null}
    </div>
  );
}

export function FilterSidebar({ filters, facets, basePath }) {
  const { go, pending } = useNavigate(basePath);
  return (
    <div className={pending ? "opacity-60 transition-opacity" : ""} aria-busy={pending}>
      <FilterBody filters={filters} facets={facets} go={go} />
    </div>
  );
}

export function Toolbar({ filters, facets, basePath, total, chips }) {
  const { go, pending } = useNavigate(basePath);
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setOpen(true)}>
          <Icon name="filter" size={15} /> Filters{count ? ` (${count})` : ""}
        </button>
        <p className="text-sm text-muted" aria-live="polite">
          {pending ? <Spinner size={14} className="mr-2 inline" /> : null}
          {total === 1 ? "1 product" : `${total} products`}
        </p>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Sort by</span>
          <select aria-label="Sort products" value={filters.sort || "relevance"} onChange={(e) => go({ ...filters, sort: e.target.value === "relevance" ? undefined : e.target.value })} className="input min-h-9 w-auto py-1 pr-8 text-sm">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {chips.map((c) => (
            <button key={c.key} type="button" onClick={() => go(c.remove)} className="chip hover:border-ink" aria-label={`Remove filter ${c.label}`}>
              {c.label} <Icon name="close" size={12} />
            </button>
          ))}
          <button type="button" onClick={() => go(filters.q ? { q: filters.q } : {})} className="text-xs text-olive-800 underline underline-offset-4">
            Clear all
          </button>
        </div>
      ) : null}
      {open ? (
        <Drawer open onClose={() => setOpen(false)} title="Filters" side="left" width="max-w-sm" footer={<button type="button" className="btn btn-primary w-full" onClick={() => setOpen(false)}>Show {total} products</button>}>
          <div className={`px-5 ${pending ? "opacity-60" : ""}`}>
            <FilterBody filters={filters} facets={facets} go={go} />
          </div>
        </Drawer>
      ) : null}
    </>
  );
}
