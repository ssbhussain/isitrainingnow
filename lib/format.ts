import type { Quantity } from "@/lib/weather-engine";

export function fmt(quantity: Quantity | null | undefined, digits = 1): string {
  if (!quantity || quantity.value == null || !Number.isFinite(quantity.value)) return "no reading";
  return `${quantity.value.toFixed(digits)} ${quantity.unit}`;
}

export function num(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "no reading";
  return value.toFixed(digits);
}
