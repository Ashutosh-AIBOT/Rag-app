export default function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer transition select-none">
      <div
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-indigo-500" : "bg-zinc-700"}`}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </div>
      <div className="text-left">
        <p className="text-xs font-medium text-zinc-200">{label}</p>
        {description && <p className="text-[10px] text-zinc-500">{description}</p>}
      </div>
    </label>
  );
}
