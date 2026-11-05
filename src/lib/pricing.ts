/**
 * Trip estimate shown on package pages and the booking form. Prices are per person on twin
 * sharing; children pay a CMS-set percentage of the adult price. This is an estimate — the
 * final quote (rooms, supplements, taxes) is confirmed by a travel expert on WhatsApp.
 */

export type EstimateInput = {
  /** Adult price per person for the chosen hotel category, in rupees. */
  adultPrice: number
  adults: number
  children?: number
  /** Child price as % of the adult price (0–100). */
  childPercent?: number | null
}

export function childPrice(adultPrice: number, childPercent?: number | null): number {
  const pct = Math.min(100, Math.max(0, childPercent ?? 50))
  return Math.round((adultPrice * pct) / 100)
}

export function estimateTotal({
  adultPrice,
  adults,
  children = 0,
  childPercent,
}: EstimateInput): number {
  if (!(adultPrice > 0) || !(adults > 0)) return 0
  return adults * adultPrice + Math.max(0, children) * childPrice(adultPrice, childPercent)
}

type HotelOption = {
  category: string
  price: number
  strikePrice?: number | null
  isPopular?: boolean | null
}

/** The hotel option to preselect: the one marked Popular, else the cheapest. */
export function defaultHotel<T extends HotelOption>(options: T[]): T | undefined {
  return options.find((o) => o.isPopular) ?? [...options].sort((a, b) => a.price - b.price)[0]
}
