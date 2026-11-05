/** Option lists shared by the CMS collections, the website filters and the forms. */

export const HOTEL_CATEGORIES = [
  { label: 'Standard 3★', value: 'standard3' },
  { label: 'Deluxe 4★', value: 'deluxe4' },
  { label: 'Luxury 5★', value: 'luxury5' },
] as const
export type HotelCategory = (typeof HOTEL_CATEGORIES)[number]['value']

export const hotelCategoryLabel = (value: string): string =>
  HOTEL_CATEGORIES.find((c) => c.value === value)?.label ?? value

export const PACKAGE_THEMES = [
  { label: 'Beach', value: 'beach' },
  { label: 'Family', value: 'family' },
  { label: 'Couples', value: 'couples' },
  { label: 'Honeymoon', value: 'honeymoon' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Value', value: 'value' },
  { label: 'Pilgrimage', value: 'pilgrimage' },
  { label: 'Corporate', value: 'corporate' },
] as const

export const PACKAGE_BADGES = [
  { label: 'None', value: 'none' },
  { label: 'Bestseller', value: 'bestseller' },
  { label: 'New', value: 'new' },
  { label: 'Limited offer', value: 'limitedOffer' },
] as const

export const DESTINATION_TONES = [
  { label: 'Coast', value: 'coast' },
  { label: 'Desert', value: 'desert' },
  { label: 'Forest', value: 'forest' },
  { label: 'Romance', value: 'romance' },
  { label: 'Pilgrim', value: 'pilgrim' },
  { label: 'Mountain', value: 'mountain' },
] as const

/** Category tile colours from the homepage "Our Categories" design. */
export const CATEGORY_COLOURS = [
  { label: 'Ocean', value: 'ocean' },
  { label: 'Ink', value: 'ink' },
  { label: 'Pilgrim', value: 'pilgrim' },
  { label: 'Plum', value: 'plum' },
  { label: 'Forest', value: 'forest' },
  { label: 'Marigold', value: 'marigold' },
  { label: 'Mountain', value: 'mountain' },
] as const

export const TRIP_TYPES = [
  { label: 'Domestic', value: 'domestic' },
  { label: 'International', value: 'international' },
  { label: 'Honeymoon', value: 'honeymoon' },
  { label: 'Religious', value: 'religious' },
  { label: 'Family', value: 'family' },
  { label: 'MICE', value: 'mice' },
] as const

export const TRAVELLER_GROUPS = [
  { label: '2 adults', value: '2-adults' },
  { label: 'Family (2+2)', value: 'family-2-2' },
  { label: 'Group (6+)', value: 'group-6' },
  { label: 'Solo', value: 'solo' },
] as const

export const BUDGETS = [
  { label: 'Under ₹25k', value: 'under-25k' },
  { label: '₹25k – ₹50k', value: '25k-50k' },
  { label: '₹50k – ₹1L', value: '50k-1l' },
  { label: '₹1L+', value: '1l-plus' },
] as const

export const BOOKING_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export const ENQUIRY_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Quote sent', value: 'quoteSent' },
  { label: 'Converted', value: 'converted' },
  { label: 'Closed', value: 'closed' },
] as const

export const ENQUIRY_SOURCES = [
  { label: 'Find Your Perfect Trip', value: 'tripFinder' },
  { label: 'Contact form', value: 'contactForm' },
  { label: 'Ask on WhatsApp', value: 'askWhatsApp' },
  { label: 'Phone / walk-in', value: 'phone' },
] as const

export const WHATSAPP_STATUSES = [
  { label: 'Not sent', value: 'notSent' },
  { label: 'Queued', value: 'queued' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Read', value: 'read' },
  { label: 'Failed', value: 'failed' },
] as const

export const WHATSAPP_PROVIDERS = [
  { label: 'Gupshup', value: 'gupshup' },
  { label: 'Interakt', value: 'interakt' },
  { label: 'WATI', value: 'wati' },
  { label: 'AiSensy', value: 'aisensy' },
  { label: 'MSG91', value: 'msg91' },
  { label: 'Twilio', value: 'twilio' },
] as const

export const MEDIA_FOLDERS = [
  { label: 'Packages', value: 'packages' },
  { label: 'Destinations', value: 'destinations' },
  { label: 'Slider', value: 'slider' },
  { label: 'Blog', value: 'blog' },
  { label: 'Team & brand', value: 'brand' },
  { label: 'General', value: 'general' },
] as const

/** Lowest hotel-category price, used as the card's "Starting from" price. */
export function startingPrice(
  options: { price?: number | null }[] | null | undefined,
): number | null {
  const prices = (options ?? [])
    .map((o) => o.price)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  return prices.length ? Math.min(...prices) : null
}

export const MONTHS = [
  { label: 'Jan', value: 'jan' },
  { label: 'Feb', value: 'feb' },
  { label: 'Mar', value: 'mar' },
  { label: 'Apr', value: 'apr' },
  { label: 'May', value: 'may' },
  { label: 'Jun', value: 'jun' },
  { label: 'Jul', value: 'jul' },
  { label: 'Aug', value: 'aug' },
  { label: 'Sep', value: 'sep' },
  { label: 'Oct', value: 'oct' },
  { label: 'Nov', value: 'nov' },
  { label: 'Dec', value: 'dec' },
] as const
export type Month = (typeof MONTHS)[number]['value']

/** Listing filter buckets (design: "Duration 1–3 N / 4–6 N / 7+ N"). */
export const DURATION_BUCKETS = [
  { label: '1–3 N', value: '1-3', min: 1, max: 3 },
  { label: '4–6 N', value: '4-6', min: 4, max: 6 },
  { label: '7+ N', value: '7+', min: 7, max: 60 },
] as const
