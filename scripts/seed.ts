/**
 * Demo content matching the Go Travels design, so every website and CMS screen has data.
 *
 *   npm run seed
 *
 * Resets all content collections (packages, bookings, posts, media …) and the globals.
 * CMS users are upserted by email, so an account you created yourself is never touched.
 * Seed users sign in with SEED_USER_PASSWORD from .env. Refuses to run in production.
 */
import fs from 'node:fs'
import path from 'node:path'

import { getPayload, type CollectionSlug, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'
import { block, h2, richText, ul } from '../src/lib/lexical'

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed a production database. Pass --force if you really mean it.')
  process.exit(1)
}

const password = process.env.SEED_USER_PASSWORD
if (!password || password.length < 12) {
  console.error('Set SEED_USER_PASSWORD (12+ characters) in .env before seeding.')
  process.exit(1)
}

const ctx = { disableRevalidate: true }
const root = path.resolve(import.meta.dirname, '..')

// Collections wiped and recreated, in dependency-safe delete order.
const RESET: CollectionSlug[] = [
  'messageLog',
  'reviewLinks',
  'bookings',
  'enquiries',
  'testimonials',
  'posts',
  'postCategories',
  'pages',
  'slides',
  'packages',
  'categories',
  'destinations',
  'media',
  'counters',
]

async function reset(payload: Payload) {
  for (const collection of RESET) {
    await payload.delete({
      collection,
      where: { id: { exists: true } },
      context: ctx,
      overrideAccess: true,
    })
  }
}

/** Rasterises a design-system illustration to PNG and uploads it (Payload converts to WebP). */
async function uploadIllustration(payload: Payload, file: string, alt: string, folder: string) {
  const svg = fs.readFileSync(path.join(root, 'public/brand/illustrations', `${file}.svg`))
  const data = await sharp(svg, { density: 144 }).resize({ width: 1920 }).png().toBuffer()
  const doc = await payload.create({
    collection: 'media',
    data: { alt, folder: folder as 'general' },
    file: { data, mimetype: 'image/png', name: `${file}.png`, size: data.length },
    context: ctx,
  })
  return doc.id
}

async function main() {
  const payload = await getPayload({ config })
  payload.logger.info('Seeding Go Travels demo content…')
  await reset(payload)

  // ---- Media (placeholder illustrations until real photos are uploaded) ----
  const img: Record<string, number> = {}
  const illustrations: [string, string, string][] = [
    ['hero', 'Night sky over the sea with a rising sun', 'slider'],
    ['beach', 'Palm trees on a sunny beach', 'packages'],
    ['fort', 'Coastal fort and lighthouse', 'packages'],
    ['desert', 'City skyline beside desert dunes', 'packages'],
    ['desert-night', 'Desert camp under the night sky', 'packages'],
    ['waterfall', 'Waterfall in a green forest', 'packages'],
    ['villa', 'Private pool villa among palms', 'packages'],
    ['temple', 'Temple silhouette at sunrise', 'packages'],
    ['mountains', 'Snow mountains above a lake', 'packages'],
    ['hills', 'Rolling green hills', 'packages'],
    ['sunset', 'Sunset over a hill station', 'packages'],
    ['map', 'Illustrated map', 'general'],
  ]
  for (const [file, alt, folder] of illustrations)
    img[file] = await uploadIllustration(payload, file, alt, folder)
  payload.logger.info(`Media: ${illustrations.length} illustrations`)

  // ---- Users (upsert by email; never deletes other accounts) ----
  const people = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh@gotravels.in',
      role: 'owner',
      whatsappAlerts: 'primary',
      status: 'active',
      phone: '+91 98765 43210',
    },
    {
      name: 'Priya Sinha',
      email: 'priya@gotravels.in',
      role: 'manager',
      whatsappAlerts: 'yes',
      status: 'active',
      phone: '+91 91234 56780',
    },
    {
      name: 'Rohit Verma',
      email: 'rohit@gotravels.in',
      role: 'sales',
      whatsappAlerts: 'assignedOnly',
      status: 'active',
      phone: '+91 99055 31270',
    },
    {
      name: 'Pooja Tirkey',
      email: 'pooja@gotravels.in',
      role: 'contentEditor',
      whatsappAlerts: 'no',
      status: 'invited',
      phone: '',
    },
  ] as const
  const user: Record<string, number> = {}
  for (const person of people) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: person.email } },
      limit: 1,
    })
    const data = { ...person, password }
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'users', id: existing.docs[0].id, data, context: ctx })
      : await payload.create({ collection: 'users', data, context: ctx })
    user[person.role] = doc.id
  }
  payload.logger.info('Users: owner, manager, sales, content editor')

  // ---- Destinations ----
  const destinationData = [
    {
      name: 'Goa',
      slug: 'goa',
      region: 'West India',
      tone: 'coast',
      thumb: 'beach',
      intro: 'Beaches, Portuguese heritage and easy evenings by the sea.',
    },
    {
      name: 'Kashmir',
      slug: 'kashmir',
      region: 'North India',
      tone: 'mountain',
      thumb: 'mountains',
      intro: 'Houseboats on Dal Lake, meadows and snow in the high valleys.',
    },
    {
      name: 'Ranchi & Waterfalls',
      slug: 'ranchi-waterfalls',
      region: 'Jharkhand',
      tone: 'forest',
      thumb: 'waterfall',
      intro: 'Hundru, Dassam and Jonha falls, a short drive from Ranchi.',
    },
    {
      name: 'Netarhat',
      slug: 'netarhat',
      region: 'Jharkhand',
      tone: 'forest',
      thumb: 'hills',
      intro: 'The hill station of Jharkhand, known for its sunsets.',
    },
    {
      name: 'Deoghar',
      slug: 'deoghar',
      region: 'Jharkhand',
      tone: 'pilgrim',
      thumb: 'temple',
      intro: 'Baba Baidyanath Dham and Basukinath, with darshan help.',
    },
    {
      name: 'Dubai',
      slug: 'dubai',
      region: 'Middle East',
      tone: 'desert',
      thumb: 'desert',
      intro: 'Skyline views, desert safaris and dhow cruises.',
      intl: true,
    },
    {
      name: 'Thailand',
      slug: 'thailand',
      region: 'Southeast Asia',
      tone: 'coast',
      thumb: 'beach',
      intro: 'Bangkok temples, Pattaya and island day trips.',
      intl: true,
    },
    {
      name: 'Bali',
      slug: 'bali',
      region: 'Southeast Asia',
      tone: 'romance',
      thumb: 'villa',
      intro: 'Private pool villas and rice terraces.',
      intl: true,
      noPage: true,
    },
    {
      name: 'Singapore',
      slug: 'singapore',
      region: 'Southeast Asia',
      tone: 'coast',
      thumb: 'fort',
      intro: 'Gardens, theme parks and food streets for the whole family.',
      intl: true,
    },
    {
      name: 'Europe',
      slug: 'europe',
      region: 'Europe',
      tone: 'mountain',
      thumb: 'mountains',
      intro: 'Alpine trains, old towns and river cruises.',
      intl: true,
      noPage: true,
    },
  ]
  const dest: Record<string, number> = {}
  for (const d of destinationData) {
    const doc = await payload.create({
      collection: 'destinations',
      data: {
        name: d.name,
        slug: d.slug,
        generateSlug: false,
        region: d.region,
        tone: d.tone as 'coast',
        isInternational: Boolean(d.intl),
        thumbnail: img[d.thumb],
        heroImage: img[d.thumb],
        intro: d.intro,
        hasPage: !d.noPage,
      },
      context: ctx,
    })
    dest[d.slug] = doc.id
  }
  payload.logger.info(`Destinations: ${destinationData.length}`)

  // Destination page content (design: "Desktop · Destination page" for Goa).
  const destinationDetails: Record<string, Record<string, unknown>> = {
    goa: {
      intro: "Beaches, forts, churches and sunset cruises — India's easiest beach holiday.",
      facts: {
        bestTime: 'November – February',
        idealDuration: '3 – 5 nights',
        nearestAirports: 'Dabolim (GOI) · Mopa (GOX)',
      },
      places: [
        {
          name: 'Baga & Calangute',
          text: 'Lively beaches, water sports and night markets.',
          image: img.beach,
        },
        {
          name: 'Fort Aguada',
          text: 'A 17th-century Portuguese fort and lighthouse above the sea.',
          image: img.fort,
        },
        {
          name: 'Old Goa',
          text: 'The Basilica of Bom Jesus and Se Cathedral, a short drive from Panaji.',
          image: img.temple,
        },
        {
          name: 'Palolem',
          text: 'A quieter crescent beach in South Goa, good for families.',
          image: img.sunset,
        },
      ],
      seasons: {
        bestMonths: ['nov', 'dec', 'jan', 'feb'],
        bestNote: 'pleasant, peak season',
        goodMonths: ['mar', 'oct'],
        goodNote: 'warm, fewer crowds',
        offMonths: ['jun', 'jul', 'aug', 'sep'],
        offNote: 'monsoon: green, many beach shacks closed',
      },
      faqs: [
        {
          question: 'How many days are enough for Goa?',
          answer:
            'Three to four nights covers North and South Goa comfortably; add a night for a slower pace.',
        },
        {
          question: 'Which airport should I fly into?',
          answer:
            'Both Dabolim (GOI) and Mopa (GOX) work. We arrange pickup from either, or from Madgaon railway station.',
        },
        {
          question: 'Is Goa good for families?',
          answer:
            'Yes. South Goa beaches are calmer, and we pick hotels with pools and family rooms.',
        },
      ],
    },
    kashmir: {
      facts: {
        bestTime: 'March – October · December for snow',
        idealDuration: '5 – 7 nights',
        nearestAirports: 'Srinagar (SXR)',
      },
      seasons: {
        bestMonths: ['apr', 'may', 'jun', 'sep', 'oct'],
        bestNote: 'meadows and lakes',
        goodMonths: ['dec', 'jan', 'feb'],
        goodNote: 'snow in Gulmarg',
      },
      places: [
        {
          name: 'Dal Lake',
          text: 'Houseboats and shikara rides at sunrise.',
          image: img.mountains,
        },
        { name: 'Gulmarg', text: 'The gondola, meadows and winter snow.', image: img.hills },
      ],
    },
    dubai: {
      facts: {
        bestTime: 'November – March',
        idealDuration: '4 – 5 nights',
        nearestAirports: 'Dubai International (DXB)',
      },
      seasons: {
        bestMonths: ['nov', 'dec', 'jan', 'feb', 'mar'],
        bestNote: 'mild, outdoor season',
        offMonths: ['jun', 'jul', 'aug'],
        offNote: 'very hot, indoor attractions',
      },
      faqs: [
        {
          question: 'Do Indians need a visa for Dubai?',
          answer:
            'Most travellers need a tourist visa. We help you prepare the application when you book. [Check current rules before travel.]',
        },
      ],
    },
  }
  for (const [slug, data] of Object.entries(destinationDetails)) {
    await payload.update({
      collection: 'destinations',
      id: dest[slug],
      data: data as never,
      context: ctx,
    })
  }

  // ---- Categories ----
  const categoryData = [
    {
      name: 'Domestic Tours',
      slug: 'domestic',
      eyebrow: 'INDIA',
      subtitle: 'Goa, Kashmir, Kerala, Jharkhand',
      colour: 'ocean',
      subs: ['goa', 'kashmir', 'ranchi-waterfalls', 'netarhat', 'deoghar'],
    },
    {
      name: 'International Tours',
      slug: 'international',
      eyebrow: 'ABROAD',
      subtitle: 'Dubai, Bali, Europe, Singapore',
      colour: 'ink',
      subs: ['dubai', 'thailand', 'bali', 'singapore', 'europe'],
      intro:
        'Visa guidance, handpicked hotels and local experiences abroad — every package can be customised.',
    },
    {
      name: 'Religious Tours',
      slug: 'religious',
      eyebrow: 'PILGRIMAGE',
      subtitle: 'Char Dham, Deoghar, Varanasi',
      colour: 'pilgrim',
      subs: ['deoghar'],
    },
    {
      name: 'Honeymoon Tours',
      slug: 'honeymoon',
      eyebrow: 'COUPLES',
      subtitle: 'Private stays & romantic extras',
      colour: 'plum',
      subs: ['bali', 'goa', 'kashmir'],
    },
    {
      name: 'Family Tours',
      slug: 'family',
      eyebrow: 'FAMILIES',
      subtitle: 'Kid-friendly pace and hotels',
      colour: 'marigold',
      subs: ['goa', 'singapore', 'thailand', 'dubai'],
    },
    {
      name: 'Jharkhand Tours',
      slug: 'jharkhand',
      eyebrow: 'JHARKHAND',
      subtitle: 'Waterfalls, hills and temples close to home',
      colour: 'forest',
      subs: ['ranchi-waterfalls', 'netarhat', 'deoghar'],
    },
    {
      name: 'MICE',
      slug: 'mice',
      eyebrow: 'CORPORATE',
      subtitle: 'Offsites, conferences and incentive trips',
      colour: 'mountain',
      subs: [],
    },
  ]
  const cat: Record<string, number> = {}
  for (const c of categoryData) {
    const doc = await payload.create({
      collection: 'categories',
      data: {
        name: c.name,
        slug: c.slug,
        generateSlug: false,
        eyebrow: c.eyebrow,
        subtitle: c.subtitle,
        intro: c.intro,
        colour: c.colour as 'ocean',
        subDestinations: c.subs.map((s) => dest[s]),
        showOnHome: true,
      },
      context: ctx,
    })
    cat[c.slug] = doc.id
  }
  payload.logger.info(`Categories: ${categoryData.length}`)

  // ---- Packages ----
  const standardPolicy = richText(
    'No online payment is taken on the website. Your booking request goes to our team on WhatsApp; a travel expert confirms availability and shares payment details and the final invoice directly.',
    ul([
      '30+ days before travel: full refund minus non-refundable bookings (flights, visas).',
      '15–29 days before travel: 50% of the package cost is refundable.',
      'Less than 15 days before travel: non-refundable.',
    ]),
    '[Confirm these cancellation terms with the business before launch.]',
  )

  type Pkg = {
    title: string
    slug: string
    tourCode: string
    destination: string
    nights: number
    categories: string[]
    themes: string[]
    badge?: string
    popular?: boolean
    slider?: boolean
    status?: 'draft' | 'published'
    cities?: string
    pickup?: string
    card: string
    highlights: { stay: string; meals: string; transport: string }
    overview: string
    gallery: string[]
    days: [string, string][]
    inclusions: string[]
    exclusions: string[]
    hotels: [string, number, number | null, string, boolean?][]
    addOns?: [string, number?][]
    faqs?: [string, string][]
  }

  const packages: Pkg[] = [
    {
      title: 'Goa Beach Escape with North & South Goa Tour',
      slug: 'goa-beach-escape',
      tourCode: 'GT-GOA-04',
      destination: 'goa',
      nights: 3,
      categories: ['domestic', 'family', 'honeymoon'],
      themes: ['beach', 'family', 'couples'],
      badge: 'bestseller',
      popular: true,
      pickup: 'Goa Airport (GOI) / Madgaon',
      cities: 'North Goa · South Goa',
      card: 'Hotel · Breakfast · Transfers',
      highlights: { stay: '3★ / 4★ / 5★', meals: 'Daily breakfast', transport: 'Private AC cab' },
      overview:
        "Sun, sand and Portuguese heritage in one easy trip. Spend a day on North Goa's lively beaches and forts, a day among South Goa's quiet shores and Old Goa's churches, with evenings free to explore.",
      gallery: ['beach', 'fort', 'sunset'],
      days: [
        [
          'Arrive in Goa · Evening at Baga & Calangute',
          'Pickup from airport or station, hotel check-in, then a relaxed evening on North Goa beaches. Overnight in Goa.',
        ],
        [
          'North Goa sightseeing',
          'Fort Aguada, Sinquerim, Anjuna and Vagator beaches, Chapora Fort viewpoint. Optional water sports at Calangute.',
        ],
        [
          'South Goa & Old Goa heritage',
          'Basilica of Bom Jesus, Se Cathedral, Miramar beach, Dona Paula viewpoint and an optional Mandovi river cruise.',
        ],
        [
          'Departure',
          'Breakfast, check-out and drop to the airport or railway station with memories to take home.',
        ],
      ],
      inclusions: [
        '3 nights hotel stay',
        'Daily breakfast',
        'Airport / station transfers',
        'North & South Goa sightseeing',
        'All toll, parking, driver charges',
      ],
      exclusions: [
        'Flights / train tickets',
        'Lunch & dinner',
        'Water sports & entry tickets',
        'Personal expenses',
        'GST as applicable',
      ],
      hotels: [
        ['standard3', 12499, 15999, 'Sea Breeze Inn, Calangute or similar'],
        ['deluxe4', 16999, null, 'Coral Bay Resort, Candolim or similar', true],
        ['luxury5', 24999, null, 'Azure Grand Beach Resort or similar'],
      ],
      addOns: [['Flight booking help'], ['Water sports combo', 1800], ['Candlelight dinner', 3500]],
      faqs: [
        [
          'Can I change the hotel?',
          'Yes. Tell us your preference on WhatsApp and we will quote the difference.',
        ],
        ['Is the cab shared?', 'No. Sightseeing is in a private AC cab for your group.'],
      ],
    },
    {
      title: 'Dubai Highlights with Desert Safari & Dhow Cruise',
      slug: 'dubai-highlights',
      tourCode: 'GT-DXB-05',
      destination: 'dubai',
      nights: 4,
      categories: ['international', 'family'],
      themes: ['family', 'luxury'],
      badge: 'bestseller',
      popular: true,
      pickup: 'Dubai International Airport (DXB)',
      cities: 'Dubai',
      card: 'Hotel · Visa help · Tours',
      highlights: {
        stay: '3★ / 4★ / 5★',
        meals: 'Daily breakfast',
        transport: 'Shared coach tours',
      },
      overview:
        'A first visit to Dubai done right: the Burj Khalifa view, a desert safari with dinner, a dhow cruise on the creek and a free day for shopping.',
      gallery: ['desert', 'desert-night'],
      days: [
        [
          'Arrive in Dubai · Dhow cruise dinner',
          'Airport pickup, hotel check-in and an evening dhow cruise with dinner on Dubai Creek.',
        ],
        [
          'City tour & Burj Khalifa',
          'Half-day city tour, then the At the Top view from the Burj Khalifa and the Dubai Fountain show.',
        ],
        [
          'Desert safari',
          'Free morning. Afternoon dune drive, camel ride and BBQ dinner at a desert camp.',
        ],
        ['Free day for shopping', 'Explore Dubai Mall, the gold souk or add a theme-park ticket.'],
        ['Departure', 'Breakfast, check-out and airport drop.'],
      ],
      inclusions: [
        '4 nights hotel stay',
        'Daily breakfast',
        'Airport transfers',
        'Dhow cruise with dinner',
        'Desert safari with BBQ dinner',
        'Visa application help',
      ],
      exclusions: ['Flights', 'Visa fee', 'Tourism Dirham fee', 'Lunch', 'Personal expenses'],
      hotels: [
        ['standard3', 54999, 59999, 'Citymax Bur Dubai or similar'],
        ['deluxe4', 64999, null, 'Rove Downtown or similar', true],
        ['luxury5', 79999, null, 'Taj Dubai or similar'],
      ],
      addOns: [['Flight booking help'], ['Theme park ticket', 6500]],
    },
    {
      title: 'Bangkok & Pattaya with Coral Island Day Trip',
      slug: 'bangkok-pattaya',
      tourCode: 'GT-THA-06',
      destination: 'thailand',
      nights: 5,
      categories: ['international', 'family'],
      themes: ['family', 'beach'],
      popular: true,
      cities: 'Bangkok · Pattaya',
      card: 'Hotel · Breakfast · Tours',
      highlights: { stay: '3★ / 4★', meals: 'Daily breakfast', transport: 'Private transfers' },
      overview:
        'Two nights in Pattaya with a Coral Island speedboat trip, then three in Bangkok for temples, markets and the river.',
      gallery: ['beach', 'waterfall'],
      days: [
        [
          'Arrive in Bangkok · Transfer to Pattaya',
          'Airport pickup and drive to Pattaya. Evening free.',
        ],
        [
          'Coral Island day trip',
          'Speedboat to Koh Larn for beaches and optional water sports. Lunch included.',
        ],
        [
          'Transfer to Bangkok',
          'Drive to Bangkok, check-in and an evening at Asiatique riverfront.',
        ],
        [
          'Bangkok temples & city tour',
          'Golden Buddha and Marble temples, then free time at the markets.',
        ],
        ['Free day', 'Optional Safari World or shopping at Pratunam.'],
        ['Departure', 'Breakfast and airport drop.'],
      ],
      inclusions: [
        '5 nights hotel stay',
        'Daily breakfast',
        'All transfers',
        'Coral Island trip with lunch',
        'Bangkok city tour',
      ],
      exclusions: ['Flights', 'Visa on arrival fee', 'Personal expenses'],
      hotels: [
        ['standard3', 38999, null, 'Ibis Pattaya / Ibis Bangkok or similar', true],
        ['deluxe4', 46999, null, 'Holiday Inn Express or similar'],
      ],
    },
    {
      title: 'Romantic Bali with Private Pool Villa Stay',
      slug: 'romantic-bali',
      tourCode: 'GT-BALI-06',
      destination: 'bali',
      nights: 5,
      categories: ['honeymoon', 'international'],
      themes: ['honeymoon', 'couples', 'luxury'],
      popular: true,
      cities: 'Ubud · Seminyak',
      card: 'Villa · Candlelight dinner',
      highlights: {
        stay: 'Private pool villa',
        meals: 'Breakfast + 1 dinner',
        transport: 'Private car',
      },
      overview:
        'Three nights in an Ubud pool villa among rice terraces, two by the beach in Seminyak, and a candlelight dinner for two.',
      gallery: ['villa', 'sunset'],
      days: [
        ['Arrive in Bali · Ubud villa', 'Airport pickup and check-in to your private pool villa.'],
        [
          'Ubud rice terraces & swing',
          'Tegallalang terraces, the jungle swing and a coffee plantation.',
        ],
        [
          'Kintamani volcano view',
          'Lunch with views of Mount Batur and a visit to a water temple.',
        ],
        [
          'Move to Seminyak · Candlelight dinner',
          'Beachside hotel and a candlelight dinner for two.',
        ],
        ['Tanah Lot sunset', 'Free day, then sunset at the Tanah Lot sea temple.'],
        ['Departure', 'Breakfast and airport drop.'],
      ],
      inclusions: [
        '3 nights pool villa + 2 nights beach hotel',
        'Daily breakfast',
        'Candlelight dinner',
        'Private car tours',
        'Airport transfers',
      ],
      exclusions: ['Flights', 'Visa on arrival fee', 'Entry tickets', 'Personal expenses'],
      hotels: [
        ['deluxe4', 46499, 52999, 'Ubud pool villa + Seminyak 4★ or similar', true],
        ['luxury5', 68999, null, 'Luxury villa + 5★ beach resort or similar'],
      ],
    },
    {
      title: 'Deoghar & Basukinath Darshan',
      slug: 'deoghar-basukinath',
      tourCode: 'GT-DGH-03',
      destination: 'deoghar',
      nights: 2,
      categories: ['religious', 'jharkhand'],
      themes: ['pilgrimage', 'family'],
      pickup: 'Ranchi / Deoghar station',
      card: 'Hotel · Darshan help',
      highlights: { stay: '3★', meals: 'Breakfast & dinner', transport: 'Private AC car' },
      overview:
        'Darshan at Baba Baidyanath Dham and Basukinath with planned timings and rest stops, suited to elders.',
      gallery: ['temple'],
      days: [
        [
          'Arrive in Deoghar · Evening aarti',
          'Pickup, hotel check-in and evening aarti at Baidyanath Dham.',
        ],
        [
          'Basukinath & local temples',
          'Morning darshan at Basukinath, then Naulakha Mandir and Tapovan.',
        ],
        ['Departure', 'Morning darshan and drop to the station.'],
      ],
      inclusions: [
        '2 nights hotel stay',
        'Breakfast & dinner',
        'Private AC car',
        'Darshan assistance',
      ],
      exclusions: ['Train tickets', 'Special puja charges', 'Personal expenses'],
      hotels: [['standard3', 6999, null, 'Hotel near Baidyanath Dham or similar', true]],
    },
    {
      title: 'Netarhat & Betla Hills and Wildlife',
      slug: 'netarhat-betla',
      tourCode: 'GT-JH-04',
      destination: 'netarhat',
      nights: 3,
      categories: ['jharkhand', 'domestic'],
      themes: ['adventure', 'family'],
      slider: true,
      pickup: 'Ranchi',
      card: 'Hotel · Meals · Safari',
      highlights: { stay: 'Forest lodge / hotel', meals: 'All meals', transport: 'Private SUV' },
      overview: 'Sunsets at Magnolia Point in Netarhat, then a jeep safari in Betla National Park.',
      gallery: ['hills', 'sunset', 'waterfall'],
      days: [
        ['Ranchi to Netarhat', 'Scenic drive with a stop at Lodh Falls on the way.'],
        ['Netarhat viewpoints', 'Sunrise point, Upper Ghaghri falls and sunset at Magnolia Point.'],
        ['Betla National Park', 'Drive to Betla, afternoon jeep safari and the old Palamu forts.'],
        ['Return to Ranchi', 'Breakfast and drive back to Ranchi.'],
      ],
      inclusions: ['3 nights stay', 'All meals', 'Private SUV', 'Betla jeep safari'],
      exclusions: ['Camera fees', 'Personal expenses'],
      hotels: [['standard3', 8250, null, 'Netarhat & Betla lodges or similar', true]],
    },
    {
      title: 'Ranchi Waterfalls Weekend',
      slug: 'ranchi-waterfalls-weekend',
      tourCode: 'GT-RNC-02',
      destination: 'ranchi-waterfalls',
      nights: 2,
      categories: ['jharkhand', 'domestic'],
      themes: ['adventure', 'value'],
      badge: 'new',
      pickup: 'Ranchi',
      card: 'Hotel · Breakfast · Cab',
      highlights: { stay: '3★', meals: 'Daily breakfast', transport: 'Private cab' },
      overview: 'Hundru, Dassam and Jonha falls in two easy days from Ranchi.',
      gallery: ['waterfall'],
      days: [
        ['Hundru and Jonha', 'Start early for Hundru, then Jonha falls in the afternoon.'],
        ['Dassam falls & Patratu valley', 'Dassam falls, then the Patratu valley drive.'],
        ['Departure', 'Breakfast and drop in Ranchi.'],
      ],
      inclusions: ['2 nights hotel stay', 'Daily breakfast', 'Private cab'],
      exclusions: ['Entry tickets', 'Lunch & dinner'],
      hotels: [['standard3', 5499, null, 'Ranchi city hotel or similar', true]],
    },
    {
      title: 'Kashmir Valley with Gulmarg & Pahalgam',
      slug: 'kashmir-valley',
      tourCode: 'GT-KSH-06',
      destination: 'kashmir',
      nights: 5,
      categories: ['domestic', 'honeymoon', 'family'],
      themes: ['couples', 'family'],
      pickup: 'Srinagar Airport (SXR)',
      card: 'Hotel · Houseboat · Breakfast & dinner',
      highlights: {
        stay: 'Hotel + houseboat',
        meals: 'Breakfast & dinner',
        transport: 'Private cab',
      },
      overview:
        'A night on a Dal Lake houseboat, a Gulmarg gondola ride and the valleys of Pahalgam.',
      gallery: ['mountains'],
      days: [
        ['Arrive in Srinagar · Houseboat', 'Shikara ride on Dal Lake and a night on a houseboat.'],
        ['Gulmarg day trip', 'Gondola ride (optional) and meadows.'],
        ['Pahalgam', 'Drive to Pahalgam via saffron fields.'],
        ['Aru & Betaab valleys', 'Local sightseeing by union cab.'],
        ['Back to Srinagar', 'Mughal gardens and local markets.'],
        ['Departure', 'Airport drop.'],
      ],
      inclusions: [
        '4 nights hotel + 1 night houseboat',
        'Breakfast & dinner',
        'Private cab',
        'Shikara ride',
      ],
      exclusions: ['Flights', 'Gondola tickets', 'Pony rides', 'Union cab in Pahalgam'],
      hotels: [
        ['standard3', 28999, null, 'Srinagar & Pahalgam 3★ or similar', true],
        ['deluxe4', 36999, null, 'Srinagar & Pahalgam 4★ or similar'],
      ],
    },
    {
      title: 'Singapore Family Fun with Sentosa',
      slug: 'singapore-family-fun',
      tourCode: 'GT-SIN-05',
      destination: 'singapore',
      nights: 4,
      categories: ['international', 'family'],
      themes: ['family'],
      status: 'draft',
      card: 'Hotel · Breakfast · Universal Studios',
      highlights: { stay: '3★ / 4★', meals: 'Daily breakfast', transport: 'Shared transfers' },
      overview: 'Universal Studios, Sentosa and Gardens by the Bay at a pace that suits children.',
      gallery: ['fort'],
      days: [
        ['Arrive in Singapore', 'Airport pickup and Night Safari.'],
        ['Universal Studios', 'Full day at Universal Studios Singapore.'],
        ['Sentosa', 'Cable car, S.E.A. Aquarium and Wings of Time.'],
        ['Gardens by the Bay', 'Flower Dome and Cloud Forest, then free time.'],
        ['Departure', 'Airport drop.'],
      ],
      inclusions: [
        '4 nights hotel stay',
        'Daily breakfast',
        'Attraction tickets listed',
        'Shared transfers',
      ],
      exclusions: ['Flights', 'Visa fee', 'Lunch & dinner'],
      hotels: [
        ['standard3', 44999, null, 'Hotel Boss or similar', true],
        ['deluxe4', 52999, null, 'Park Hotel Clarke Quay or similar'],
      ],
    },
  ]

  const pkg: Record<string, number> = {}
  for (const k of packages) {
    const doc = await payload.create({
      collection: 'packages',
      data: {
        title: k.title,
        slug: k.slug,
        generateSlug: false,
        tourCode: k.tourCode,
        destination: dest[k.destination],
        durationNights: k.nights,
        categories: k.categories.map((c) => cat[c]),
        themes: k.themes as 'beach'[],
        pickup: k.pickup,
        cities: k.cities,
        cardInclusions: k.card,
        highlights: k.highlights,
        overview: richText(k.overview),
        gallery: k.gallery.map((g) => img[g]),
        itinerary: k.days.map(([title, description]) => ({ title, description })),
        inclusions: k.inclusions.map((item) => ({ item })),
        exclusions: k.exclusions.map((item) => ({ item })),
        hotelOptions: k.hotels.map(([category, price, strikePrice, hotelName, isPopular]) => ({
          category: category as 'standard3',
          price,
          strikePrice,
          hotelName,
          isPopular: Boolean(isPopular),
        })),
        childPricePercent: 50,
        addOns: (k.addOns ?? []).map(([name, price]) => ({ name, price })),
        policies: standardPolicy,
        faqs: (k.faqs ?? []).map(([question, answer]) => ({ question, answer })),
        status: k.status ?? 'published',
        badge: (k.badge ?? 'none') as 'none',
        showInPopular: Boolean(k.popular),
        featureOnSlider: Boolean(k.slider),
        seo: { metaDescription: k.overview.slice(0, 160) },
      },
      context: ctx,
    })
    pkg[k.slug] = doc.id
  }
  payload.logger.info(`Packages: ${packages.length}`)

  // ---- Testimonials ----
  const testimonials = [
    [
      'Ritika Sharma',
      'goa-beach-escape',
      'Goa Beach Escape',
      'pending',
      5,
      'reviewLink',
      'Perfectly planned Goa trip — clean hotel, punctual driver, quick replies on WhatsApp.',
    ],
    [
      'Manoj Prasad',
      'deoghar-basukinath',
      'Deoghar & Basukinath',
      'pending',
      4,
      'reviewLink',
      'Darshan timings and rest stops were arranged with care for my parents.',
    ],
    [
      'Farhan Ali',
      'dubai-highlights',
      'Dubai Highlights',
      'approved',
      5,
      'staff',
      'Desert safari and dhow cruise were the highlights. Visa help was quick.',
    ],
    [
      'Aditi & Karan',
      'romantic-bali',
      'Romantic Bali',
      'approved',
      5,
      'google',
      'The pool villa and candlelight dinner were beyond expectations.',
    ],
    [
      'Sneha Kujur',
      'netarhat-betla',
      'Netarhat & Betla',
      'approved',
      4,
      'reviewLink',
      'Netarhat sunsets were magical and the Betla safari was well organised.',
    ],
    [
      'Deepak Joshi',
      'kashmir-valley',
      'Kashmir Valley',
      'hidden',
      3,
      'staff',
      'Good houseboat stay, though the Pahalgam drive took longer than planned.',
    ],
  ] as const
  for (const [name, slug, tripLabel, status, rating, source, text] of testimonials) {
    await payload.create({
      collection: 'testimonials',
      data: { name, package: pkg[slug], tripLabel, status, rating, source, text },
      context: ctx,
    })
  }
  payload.logger.info(`Testimonials: ${testimonials.length}`)

  // ---- Blog ----
  const postCat: Record<string, number> = {}
  for (const [name, slug] of [
    ['Destination guides', 'destination-guides'],
    ['Visa & documents', 'visa-documents'],
    ['Pilgrimage', 'pilgrimage'],
    ['Honeymoon', 'honeymoon'],
    ['Travel tips', 'travel-tips'],
  ]) {
    const doc = await payload.create({
      collection: 'postCategories',
      data: { name, slug, generateSlug: false },
      context: ctx,
    })
    postCat[slug] = doc.id
  }

  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const posts = [
    {
      title: 'Waterfalls of Jharkhand: A Weekend Route from Ranchi',
      slug: 'waterfalls-of-jharkhand',
      cat: 'destination-guides',
      status: 'published',
      featured: true,
      cover: 'waterfall',
      excerpt: 'Hundru, Dassam and Jonha in two days from Ranchi.',
      content: richText(
        "Ranchi sits at the centre of some of eastern India's most striking waterfalls, and the best of them fit into a single weekend.",
        h2('Day 1 · Hundru and Jonha'),
        'Start early for Hundru, where the Subarnarekha river drops into a rocky gorge. In the afternoon, drive to Jonha and take the steps down to the pool.',
        h2('Day 2 · Dassam and Patratu'),
        'Dassam is at its fullest just after the monsoon. Finish with the hairpin drive through the Patratu valley.',
        block('packageCard', { package: pkg['ranchi-waterfalls-weekend'] }),
      ),
    },
    {
      title: 'Best Time to Visit Goa',
      slug: 'best-time-to-visit-goa',
      cat: 'destination-guides',
      status: 'published',
      cover: 'beach',
      excerpt: 'Season by season: when to go for beaches, festivals and quieter prices.',
      content: richText(
        'November to February brings dry, pleasant weather and the busiest beaches. March to May is hotter but quieter. The monsoon months turn Goa green and bring the lowest hotel prices.',
      ),
    },
    {
      title: 'Dubai Tourist Visa for Indians',
      slug: 'dubai-tourist-visa-for-indians',
      cat: 'visa-documents',
      status: 'published',
      cover: 'desert',
      excerpt: 'The documents you need and how long it usually takes.',
      content: richText(
        'Most travellers need a passport valid for six months, a recent photo and confirmed return tickets. We help you prepare the application when you book a Dubai package.',
        '[Check current visa rules before publishing — they change often.]',
      ),
    },
    {
      title: 'Deoghar & Basukinath: Shravani Mela',
      slug: 'deoghar-shravani-mela',
      cat: 'pilgrimage',
      status: 'scheduled',
      publishedAt: inAWeek,
      cover: 'temple',
      excerpt: 'Planning darshan during the Shravani Mela.',
      content: richText(
        'During the Shravan month, lakhs of devotees walk to Baidyanath Dham. Plan stays early and travel light.',
      ),
    },
    {
      title: 'Bali vs Maldives for Your Honeymoon',
      slug: 'bali-vs-maldives-honeymoon',
      cat: 'honeymoon',
      status: 'draft',
      cover: 'villa',
      excerpt: 'Villas and culture, or overwater stays and reefs?',
      content: richText(
        'Bali suits couples who want villas, food and sightseeing; the Maldives suits couples who want to stay put by the water.',
      ),
    },
    {
      title: 'Packing List for Thailand',
      slug: 'packing-list-thailand',
      cat: 'travel-tips',
      status: 'draft',
      cover: 'beach',
      excerpt: 'Light clothes, temple-appropriate outfits and the documents to carry.',
      content: richText(
        ul([
          'Light cotton clothes',
          'One outfit covering shoulders and knees for temples',
          'Sunscreen and a hat',
          'Passport copies and hotel vouchers',
        ]),
      ),
    },
  ] as const
  for (const post of posts) {
    await payload.create({
      collection: 'posts',
      data: {
        title: post.title,
        slug: post.slug,
        generateSlug: false,
        category: postCat[post.cat],
        author: user.manager,
        status: post.status,
        publishedAt: 'publishedAt' in post ? post.publishedAt : undefined,
        featured: 'featured' in post ? post.featured : false,
        cover: img[post.cover],
        excerpt: post.excerpt,
        content: post.content,
      },
      context: ctx,
    })
  }
  payload.logger.info(`Blog: ${posts.length} posts`)

  // ---- Pages ----
  const legalNote = '[Draft text — review with your legal adviser before launch.]'
  const pages = [
    {
      title: 'About Us',
      slug: 'about',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'ABOUT GO TRAVELS',
          heading: "We plan journeys the way we'd want to travel",
          intro:
            'Domestic, international, honeymoon, religious and MICE tours — planned personally by our team in Ranchi and confirmed on WhatsApp.',
          image: img.hills,
          buttons: [
            { label: 'Explore Tours', style: 'primary', linkType: 'custom', url: '/tours' },
            { label: 'Contact Us', style: 'outline', linkType: 'custom', url: '/contact' },
          ],
        },
        {
          blockType: 'features',
          eyebrow: 'OUR SERVICES',
          heading: 'Everything for your trip, in one place',
          variant: 'cards',
          items: [
            { title: 'Domestic tours', text: 'Hills, beaches and heritage across India.' },
            { title: 'International tours', text: 'Dubai, Thailand, Bali, Europe and more.' },
            { title: 'Jharkhand tours', text: 'Waterfalls, forests and temples close to home.' },
            { title: 'Religious tours', text: 'Char Dham, Deoghar, Puri and other yatras.' },
            { title: 'Honeymoon packages', text: 'Private stays and romantic extras.' },
            { title: 'MICE & corporate', text: 'Offsites, conferences and incentive trips.' },
            { title: 'Hotels & transport', text: 'Stays, cabs and transfers booked for you.' },
            { title: 'Flights & visa help', text: 'Ticketing and help with visa paperwork.' },
          ],
        },
        {
          blockType: 'features',
          eyebrow: 'HOW BOOKING WORKS',
          heading: 'No online payment — just a conversation',
          variant: 'steps',
          items: [
            { title: 'Choose a package', text: 'Or tell us your idea on the Plan My Trip form.' },
            { title: 'Send a request', text: 'Pick dates, travellers and hotel category.' },
            {
              title: 'Talk on WhatsApp',
              text: 'Our expert confirms availability and the final quote.',
            },
            { title: 'Travel', text: 'Get your vouchers and itinerary, then enjoy the trip.' },
          ],
        },
        {
          blockType: 'team',
          heading: 'Meet the team',
          members: [
            { name: 'Rajesh Kumar', role: 'Founder' },
            { name: 'Priya Sinha', role: 'Operations manager' },
            { name: 'Rohit Verma', role: 'Travel expert' },
          ],
        },
        {
          blockType: 'cta',
          heading: 'Ready to plan your trip?',
          buttonLabel: 'Find Your Perfect Trip',
          linkType: 'custom',
          url: '/plan-my-trip',
        },
      ],
    },
    {
      title: 'Contact Us',
      slug: 'contact',
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'CONTACT US',
          heading: "We'd love to plan your next trip",
          intro: 'Call, WhatsApp or drop by our office in Ranchi.',
        },
      ],
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      layout: [
        {
          blockType: 'richText',
          content: richText(
            legalNote,
            h2('What we collect'),
            'When you send a booking request or enquiry, we collect your name, WhatsApp number, email (optional), city and trip details.',
            h2('How we use it'),
            'We use these details only to respond to your request, confirm your booking and send updates on WhatsApp. Your details are sent to our team through a WhatsApp messaging provider.',
            h2('Contact'),
            'To see or delete your data, contact hello@gotravels.in.',
          ),
        },
      ],
    },
    {
      title: 'Terms & Conditions',
      slug: 'terms',
      layout: [
        {
          blockType: 'richText',
          content: richText(
            legalNote,
            'Prices shown on the website are estimates per person on twin sharing. The final price is confirmed by our travel expert on WhatsApp. No payment is taken on the website.',
            'Cancellation terms are listed on each package page.',
          ),
        },
      ],
    },
    {
      title: 'Booking & Cancellation',
      slug: 'booking-policy',
      layout: [
        {
          blockType: 'richText',
          content: richText(
            legalNote,
            h2('How booking works'),
            'A booking request on the website is not a confirmed booking. Our travel expert confirms availability, the final price and the payment schedule on WhatsApp.',
            h2('Payments'),
            'No payment is taken on the website. Payment details are shared only by our team, from our official number.',
            h2('Cancellation'),
            'Cancellation charges depend on the package, hotels and airlines involved, and are listed on each package page and in your confirmation.',
          ),
        },
      ],
    },
  ]
  for (const page of pages) {
    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        generateSlug: false,
        status: 'published',
        layout: page.layout as never,
      },
      context: ctx,
    })
  }
  payload.logger.info(`Pages: ${pages.length}`)

  // ---- Slides ----
  const day = 24 * 60 * 60 * 1000
  const slides = [
    {
      eyebrow: 'A NEW WORLD AWAITS',
      heading: 'Discover. Dream. Travel.',
      buttonLabel: 'Explore Packages',
      linkType: 'custom',
      url: '/tours',
      imageDesktop: img.hero,
      active: true,
    },
    {
      eyebrow: 'SNOW SEASON',
      heading: 'Winter in Kashmir',
      buttonLabel: 'See Kashmir tours',
      linkType: 'destination',
      destination: dest.kashmir,
      imageDesktop: img.mountains,
      active: true,
    },
    {
      eyebrow: 'CLOSE TO HOME',
      heading: 'Jharkhand Waterfalls',
      buttonLabel: 'Explore Jharkhand',
      linkType: 'category',
      category: cat.jharkhand,
      imageDesktop: img.waterfall,
      active: true,
      showFrom: new Date(Date.now() + 14 * day).toISOString(),
    },
    {
      eyebrow: 'SEASONAL',
      heading: 'Dubai Shopping Festival',
      buttonLabel: 'View Dubai tours',
      linkType: 'destination',
      destination: dest.dubai,
      imageDesktop: img.desert,
      active: false,
      showUntil: new Date(Date.now() - 30 * day).toISOString(),
    },
  ]
  for (const slide of slides) {
    await payload.create({ collection: 'slides', data: slide as never, context: ctx })
  }
  payload.logger.info(`Slides: ${slides.length}`)

  // ---- Sample bookings & enquiries (for the CMS dashboard) ----
  const bookings = [
    {
      pkg: 'goa-beach-escape',
      name: 'Ankit Kumar',
      whatsapp: '9830122457',
      date: 43,
      from: 'Ranchi',
      hotel: 'deluxe4',
      adults: 2,
      children: 0,
      total: 33998,
      wa: 'read',
      status: 'new',
      notes: 'Vegetarian meals, sea-facing room if possible.',
    },
    {
      pkg: 'dubai-highlights',
      name: 'Rahul Mehta',
      whatsapp: '9835144120',
      date: 61,
      from: 'Kolkata',
      hotel: 'deluxe4',
      adults: 2,
      children: 1,
      total: 132497,
      wa: 'delivered',
      status: 'contacted',
    },
    {
      pkg: 'deoghar-basukinath',
      name: 'Sanjay Oraon',
      whatsapp: '7004481236',
      date: 9,
      from: 'Ranchi',
      hotel: 'standard3',
      adults: 4,
      children: 0,
      total: 27996,
      wa: 'failed',
      status: 'new',
    },
    {
      pkg: 'romantic-bali',
      name: 'Neha Gupta',
      whatsapp: '9431277810',
      date: 98,
      from: 'Patna',
      hotel: 'deluxe4',
      adults: 2,
      children: 0,
      total: 92998,
      wa: 'read',
      status: 'confirmed',
    },
    {
      pkg: 'netarhat-betla',
      name: 'Vikas Mahto',
      whatsapp: '8210553419',
      date: 20,
      from: 'Ranchi',
      hotel: 'standard3',
      adults: 3,
      children: 2,
      total: 33000,
      wa: 'delivered',
      status: 'confirmed',
    },
    {
      pkg: 'kashmir-valley',
      name: 'Shalini Roy',
      whatsapp: '9608124476',
      date: 35,
      from: 'Jamshedpur',
      hotel: 'standard3',
      adults: 2,
      children: 0,
      total: 57998,
      wa: 'queued',
      status: 'cancelled',
    },
  ] as const
  for (const b of bookings) {
    const k = packages.find((x) => x.slug === b.pkg)!
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        package: pkg[b.pkg],
        packageSnapshot: { title: k.title, duration: `${k.nights}N / ${k.nights + 1}D` },
        travelDate: new Date(Date.now() + b.date * day).toISOString(),
        departureCity: b.from,
        hotelCategory: b.hotel,
        rooms: Math.ceil(b.adults / 2),
        adults: b.adults,
        children: b.children,
        name: b.name,
        whatsapp: b.whatsapp,
        specialRequests: 'notes' in b ? b.notes : undefined,
        consent: true,
        estimatedTotal: b.total,
        status: b.status,
        whatsappStatus: b.wa,
        assignedTo: user.sales,
        source: 'website',
      },
      context: ctx,
    })
    await payload.create({
      collection: 'messageLog',
      data: {
        reference: booking.requestId!,
        kind: 'booking',
        booking: booking.id,
        recipientLabel: 'Owner',
        phone: '+91 98765 43210',
        provider: 'gupshup',
        template: 'gt_booking_request',
        status: b.wa === 'failed' ? 'failed' : b.wa,
        attempts: b.wa === 'failed' ? 3 : 1,
        error: b.wa === 'failed' ? 'Sample failure: recipient not reachable.' : undefined,
      },
      context: ctx,
    })
  }
  payload.logger.info(`Bookings: ${bookings.length}`)

  const enquiries = [
    {
      name: 'Neha Gupta',
      whatsapp: '9835144120',
      tripType: 'honeymoon',
      destination: 'Bali or Maldives',
      month: '2027-02',
      travellers: '2-adults',
      budget: '50k-1l',
      source: 'tripFinder',
      assigned: true,
      note: 'Called, prefers Bali villa with private pool. Sending 2 options.',
    },
    {
      name: 'Sanjay Oraon',
      whatsapp: '7004481236',
      tripType: 'family',
      destination: 'Kerala',
      month: '2026-12',
      travellers: 'family-2-2',
      budget: '25k-50k',
      source: 'tripFinder',
    },
    {
      name: 'Priyanka Das',
      whatsapp: '9123400981',
      tripType: 'mice',
      destination: 'Corporate offsite for 40 people',
      source: 'contactForm',
      message: 'Looking for a 2-night offsite near Ranchi for 40 people in January.',
    },
    {
      name: 'Amit Singh',
      whatsapp: '9934012245',
      tripType: 'international',
      destination: 'Dubai',
      source: 'askWhatsApp',
      pkg: 'dubai-highlights',
      message: 'Question about Dubai visa processing time.',
    },
    {
      name: 'Kavita Rao',
      whatsapp: '9470011873',
      tripType: 'religious',
      destination: 'Char Dham',
      month: '2027-05',
      travellers: 'group-6',
      source: 'tripFinder',
      status: 'contacted',
    },
  ] as const
  for (const e of enquiries) {
    await payload.create({
      collection: 'enquiries',
      data: {
        name: e.name,
        whatsapp: e.whatsapp,
        tripType: e.tripType,
        destination: e.destination,
        travelMonth: 'month' in e ? e.month : undefined,
        travellers: 'travellers' in e ? e.travellers : undefined,
        budget: 'budget' in e ? e.budget : undefined,
        message: 'message' in e ? e.message : undefined,
        package: 'pkg' in e ? pkg[e.pkg] : undefined,
        source: e.source,
        status: 'status' in e ? e.status : 'new',
        whatsappStatus: 'delivered',
        assignedTo: 'assigned' in e ? user.sales : undefined,
        internalNotes: 'note' in e ? [{ text: e.note, author: user.sales }] : [],
      },
      context: ctx,
    })
  }
  payload.logger.info(`Enquiries: ${enquiries.length}`)

  // ---- Globals ----
  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Go Travels',
      tagline: 'Discover. Dream. Travel.',
      address: '2nd Floor, Lalpur Chowk, Ranchi, Jharkhand 834001',
      phones: [
        { number: '+91 98765 43210', label: 'Mobile' },
        { number: '+91 651 245 6789', label: 'Office' },
      ],
      whatsapp: '+91 98765 43210',
      email: 'hello@gotravels.in',
      workingHours: 'Mon – Sat · 10:00 AM – 07:00 PM',
      defaultMetaTitle: 'Go Travels — Domestic, International & Religious Tours',
      defaultMetaDescription: 'Handpicked tour packages with booking confirmed on WhatsApp.',
      sitemapEnabled: true,
    },
    context: ctx,
  })

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      sections: [
        'slider',
        'search',
        'popular',
        'categories',
        'whyUs',
        'ctaBand',
        'testimonials',
      ].map((section) => ({
        section: section as 'slider',
        visible: true,
      })),
      popularTabs: ['goa', 'dubai', 'thailand', 'bali', 'europe', 'singapore'].map((s) => dest[s]),
      whyUs: {
        eyebrow: 'WHY CHOOSE GO TRAVELS?',
        heading: 'Travel planned with care, end to end',
        items: [
          {
            title: 'Handpicked by experts',
            text: 'Hotels and routes our team has checked.',
            icon: 'mapPin',
          },
          {
            title: 'Confirmed on WhatsApp',
            text: 'No online payment. We confirm availability directly.',
            icon: 'whatsapp',
          },
          {
            title: 'Transparent quotes',
            text: 'All-inclusive quotes with no hidden fees.',
            icon: 'check',
          },
          {
            title: 'Support on your trip',
            text: 'A real person to call while you travel.',
            icon: 'phone',
          },
        ],
      },
    },
    context: ctx,
  })

  const catLink = (label: string, slug: string) => ({
    label,
    linkType: 'category' as const,
    category: cat[slug],
  })
  const destLink = (label: string, slug: string) => ({
    label,
    linkType: 'destination' as const,
    destination: dest[slug],
  })
  const url = (label: string, href: string) => ({ label, linkType: 'custom' as const, url: href })
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: [
        url('Home', '/'),
        {
          ...catLink('Domestic Tours', 'domestic'),
          megaMenu: [
            {
              heading: 'Beaches & mountains',
              links: [destLink('Goa', 'goa'), destLink('Kashmir', 'kashmir')],
            },
            {
              heading: 'Jharkhand',
              links: [
                destLink('Ranchi & Waterfalls', 'ranchi-waterfalls'),
                destLink('Netarhat', 'netarhat'),
                destLink('Deoghar', 'deoghar'),
              ],
            },
          ],
          featuredPackage: pkg['goa-beach-escape'],
        },
        {
          ...catLink('International Tours', 'international'),
          megaMenu: [
            { heading: 'Middle East', links: [destLink('Dubai', 'dubai')] },
            {
              heading: 'Southeast Asia',
              links: [
                destLink('Thailand', 'thailand'),
                destLink('Bali', 'bali'),
                destLink('Singapore', 'singapore'),
              ],
            },
            { heading: 'Europe', links: [destLink('Europe', 'europe')] },
          ],
          featuredPackage: pkg['dubai-highlights'],
        },
        catLink('Honeymoon', 'honeymoon'),
        catLink('Jharkhand Tours', 'jharkhand'),
        catLink('Religious Tours', 'religious'),
        catLink('MICE', 'mice'),
        url('About Us', '/about'),
        url('Contact Us', '/contact'),
      ],
      footerQuickLinks: [
        url('Home', '/'),
        url('About Us', '/about'),
        url('Our Services', '/tours'),
        url('Blogs', '/blog'),
        url('Contact Us', '/contact'),
      ],
      footerTours: [
        catLink('Domestic Tours', 'domestic'),
        catLink('International Tours', 'international'),
        catLink('Honeymoon Tours', 'honeymoon'),
        catLink('Jharkhand Tours', 'jharkhand'),
        catLink('Religious Tours', 'religious'),
        catLink('MICE', 'mice'),
      ],
    },
    context: ctx,
  })

  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data: {
      provider: 'gupshup',
      senderNumber: '+91 98765 43210',
      recipients: [
        { label: 'Owner', phone: '+91 98765 43210', isPrimary: true },
        { label: 'Sales desk', phone: '+91 91234 56780', isPrimary: false },
      ],
      sendCustomerCopy: true,
      emailFallback: true,
      fallbackEmail: 'hello@gotravels.in',
      bookingTemplate: { name: 'gt_booking_request', language: 'en' },
      enquiryTemplate: { name: 'gt_enquiry', language: 'en' },
      customerTemplate: { name: 'gt_booking_copy', language: 'en' },
      reviewTemplate: { name: 'gt_review_link', language: 'en' },
    },
    context: ctx,
  })
  payload.logger.info('Globals: site settings, homepage, menus, WhatsApp settings')

  // The website caches CMS data (Next.js data cache). Everything was recreated with new IDs, so
  // drop the cache here; a running `npm run dev` also keeps a copy in memory until restarted.
  for (const dir of ['.next/cache/fetch-cache', '.next/dev/cache/fetch-cache']) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true })
  }

  payload.logger.info(
    'Seed complete. Restart `npm run dev` if it is running, then sign in at /admin as rajesh@gotravels.in (Owner) with SEED_USER_PASSWORD.',
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
