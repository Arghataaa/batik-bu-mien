// Formatting helpers — Batik Bu Mien (Indonesian locale)

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** 185000 -> "Rp 185.000" */
export function formatRupiah(n: number | null | undefined): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `Rp ${rupiahFormatter.format(Math.round(v))}`;
}

/** 185000 -> "185.000" (no currency prefix) */
export function formatNumber(n: number | null | undefined): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return rupiahFormatter.format(Math.round(v));
}

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** "2025-03-12T10:00:00.000Z" -> "12 Mar 2025" */
export function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2025-03-12T10:00:00.000Z" -> "12 Mar 2025, 10:00" */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${hh}:${mm}`;
}

/** Convert any string into a URL-safe slug. */
export function slugify(s: string): string {
  return s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert ISO label "2025-03-12" into "12 Mar" for charts. */
export function formatTrendLabel(label: string): string {
  if (!label) return "";
  // monthly: "2025-03"
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [y, m] = label.split("-");
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTHS_ID[monthIdx]} ${y.slice(2)}`;
    }
    return label;
  }
  // daily: "2025-03-12"
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const d = new Date(label + "T00:00:00");
    if (!Number.isNaN(d.getTime())) {
      return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`;
    }
  }
  return label;
}

/** Today minus N days, as ISO date string (yyyy-mm-dd). */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Today as ISO date string (yyyy-mm-dd). */
export function isoToday(): string {
  return isoDaysAgo(0);
}

/** Build a variant label like "Size M / Warna Cokelat / Motif Kawung". */
export function variantLabel(v?: {
  size?: string | null;
  color?: string | null;
  motif?: string | null;
}): string {
  if (!v) return "";
  const parts: string[] = [];
  if (v.size) parts.push(`Size ${v.size}`);
  if (v.color) parts.push(`Warna ${v.color}`);
  if (v.motif) parts.push(`Motif ${v.motif}`);
  return parts.join(" / ");
}
