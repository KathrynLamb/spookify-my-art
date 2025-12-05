export function formatOrderDate(value: string | number | null | undefined) {
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
    }
    return "—";
  }
  