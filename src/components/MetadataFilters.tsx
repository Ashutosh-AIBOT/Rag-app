"use client";
import { useState } from "react";
import { MetadataFilters as Filters } from "@/lib/api";

export default function MetadataFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const activeCount = [
    filters.source, filters.section, filters.strategy,
    filters.page_min, filters.page_max,
    filters.tags?.length, filters.date_from, filters.date_to,
  ].filter(Boolean).length;

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <span>Metadata Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-gold-400 bg-gold-500/10 border border-gold-500/25 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-xs">{open ? "Collapse" : "Expand"}</span>
          <svg className={`h-4 w-4 transform transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="p-5 pt-0 border-t border-zinc-800/60 bg-zinc-950/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="label">Source Document</label>
            <input className="input-field" placeholder="e.g. pricing_guide.txt" value={filters.source || ""} onChange={(e) => set({ source: e.target.value || null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Section Header</label>
            <input className="input-field" placeholder="e.g. Financial Summary" value={filters.section || ""} onChange={(e) => set({ section: e.target.value || null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Chunk Strategy</label>
            <div className="relative">
              <select className="input-field appearance-none cursor-pointer" value={filters.strategy || ""} onChange={(e) => set({ strategy: e.target.value || null })}>
                <option value="">Any Strategy</option>
                <option value="recursive">Recursive Splitting</option>
                <option value="semantic">Semantic Chunking</option>
                <option value="parent_child">Parent-Child Chunking</option>
                <option value="section">Section-based Splitting</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="label">Page Range (Min)</label>
            <input type="number" placeholder="Min Page" className="input-field" value={filters.page_min ?? ""} onChange={(e) => set({ page_min: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Page Range (Max)</label>
            <input type="number" placeholder="Max Page" className="input-field" value={filters.page_max ?? ""} onChange={(e) => set({ page_max: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Tags (comma separated)</label>
            <input className="input-field" placeholder="finance, legal" value={(filters.tags || []).join(", ")} onChange={(e) => set({ tags: e.target.value ? e.target.value.split(",").map((t) => t.trim()) : null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Uploaded Date (From)</label>
            <input type="date" className="input-field" value={filters.date_from || ""} onChange={(e) => set({ date_from: e.target.value || null })} />
          </div>
          <div className="space-y-1.5">
            <label className="label">Uploaded Date (To)</label>
            <input type="date" className="input-field" value={filters.date_to || ""} onChange={(e) => set({ date_to: e.target.value || null })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
            <label className="label">Filter Logic</label>
            <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1 max-w-[150px]">
              {(["and", "or"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => set({ filter_logic: op })}
                  className={`flex-1 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                    (filters.filter_logic || "and") === op
                      ? "bg-gold-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
