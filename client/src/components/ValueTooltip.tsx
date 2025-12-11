import { formatBRL } from "../lib/normalize";

export default function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const name = p?.name ?? label;
  const val = typeof p?.value === "number" ? p.value : Number(p?.value || 0);
  return (
    <div className="rounded-lg bg-neutral-900 text-neutral-100 border border-amber-500/30 px-3 py-2 text-sm">
      <div>{name}</div>
      <div className="font-semibold">{formatBRL(val)}</div>
    </div>
  );
}
