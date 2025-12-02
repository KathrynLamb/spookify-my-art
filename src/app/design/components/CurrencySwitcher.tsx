"use client";

const currencies = ["GBP", "USD", "EUR"] as const;

export type Currency = (typeof currencies)[number];

type Props = {
  value: Currency;
  onChange: (c: Currency) => void;
};

export default function CurrencySwitcher({ value, onChange }: Props) {
  return (
    <select
      className="bg-black/30 border border-white/20 rounded-md px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
    >
      {currencies.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
