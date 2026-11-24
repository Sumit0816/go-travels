# Go Travels CMS: staff guide

Sign in at **gotravels.in/admin** with the email and password you were invited with. After 5 wrong passwords the account locks for 15 minutes. Use **Forgot password** on the sign-in page if needed.

What you see depends on your role:

| Role               | Can do                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Owner**          | Everything, including users, Site Settings and WhatsApp Integration                             |
| **Manager**        | Bookings, enquiries and all content; can view WhatsApp settings                                 |
| **Sales**          | Bookings (change status, add notes), enquiries assigned to them, view packages and testimonials |
| **Content Editor** | Packages, destinations, homepage, slider, blog, pages, testimonials, media                      |

## Every day: bookings and enquiries

**Dashboard (Bookings).** This is the first screen. It shows this month's numbers and the latest booking requests, with each one's WhatsApp delivery status.

- Change a booking's **status** straight from the table: New → Contacted → Confirmed (or Cancelled). "Confirmed this month" counts from the day it was marked Confirmed.
- Open a booking to see the trip, the traveller's details and the estimated total, and to add **internal notes**. The customer never sees notes.
- **WhatsApp** column: _Sent_ means our team received it; _Delivered_ and _Read_ follow when the provider confirms. _Failed_ means every team number failed after the retries. The details were also emailed to the fallback address. Use **Resend** once WhatsApp is working again.
- **Export CSV** downloads the bookings in the current filter, for Excel.

Prices on the website are estimates. Always confirm the final price, dates and payment details with the customer on WhatsApp. **No payment is taken on the website.**

**Enquiries** come from "Find Your Perfect Trip", the Contact form and phone calls. Open one to assign it, change its status (New → Contacted → Quote sent → Converted / Closed) and add notes. **Convert to booking** creates a booking with the details filled in.

## Packages

**Packages › Create new**, then fill the tabs from top to bottom:

1. **Basic information:** title, tour code, destination, nights/days, categories (these decide which menus and listings it appears in), and the short "card inclusions" line, e.g. _Hotel · Breakfast · Transfers_.
2. **Overview & gallery:** the description, and at least 5 photos. The first photo is the big one.
3. **Itinerary:** one row per day.
4. **Inclusions** and exclusions.
5. **Pricing & hotels:** a price per person (twin sharing) for each hotel category you offer. Tick **Popular** on the one to preselect. _Child price_ is a % of the adult price. Add-ons are optional extras charged once per booking.
6. **Policies & FAQs:** cancellation terms show on the package page.
7. **SEO:** leave empty to use the title and description automatically.

Set **Status** to _Published_ to put it on the website; _Draft_ keeps it hidden. The site updates within a few seconds of saving.

## Images (Media Library)

- Upload JPEG, PNG, WebP or AVIF, up to 10 MB. The site makes small, fast WebP copies automatically. SVG files aren't accepted, for security.
- Always write **Alt text** describing the photo ("Baga beach at sunset"). It helps Google and blind visitors.
- Drag the **focal point** onto the important part of the photo, so it stays in frame on phones and in cards.
- Use photos you own or have a licence for, and fill in **Credit** when the licence requires it.

## Homepage and slider

- **Slides:** each slide needs a desktop image and, ideally, a mobile image (portrait). **Show from / until** schedules seasonal offers: a slide outside its dates is hidden automatically.
- **Homepage** (under Content) sets the order of the homepage sections and which ones show, plus the "Why choose us" text.
- **Menus** sets the header mega-menu and the footer links.

## Blog and pages

- **Blog posts:** write in the editor, use _Heading 2_ for sections (they become the "On this page" list), and insert a **Package card** block to link a tour inside the article. _Scheduled_ posts go live at their publish date.
- **Pages** hold About, Contact and the three policies. The policy texts are drafts: **have them checked by a legal professional before launch**.

## Testimonials

New reviews arrive as **Pending**. Read them on the Testimonials board, then **Approve** to show one on the website, or hide it. Staff can also add reviews they received by phone or on Google.

## Settings (Owner)

- **Site Settings:** phone numbers, WhatsApp number, email, address, hours, map, social links, default SEO text and share image, Google Analytics ID and Search Console code.
- **WhatsApp Integration:**
  - provider, API key (stored encrypted; leave the box empty to keep the saved key), sender number, recipients (mark one _Primary_), customer copy, fallback email and template names
  - on the **Test & delivery log** tab, **Send test message** checks everything, and the log shows every message with any error
- **Users:** invite staff with the right role. Suspend people who leave rather than deleting them, so their notes keep their name.

## If something goes wrong

- **A customer says they booked but you have nothing on WhatsApp:** check the dashboard. Every request is saved even when WhatsApp fails. Look at the WhatsApp column, then Settings › WhatsApp delivery log for the error.
- **A change doesn't show on the website:** check the item is _Published_, then refresh after a few seconds.
- **Anything else:** note the time, the page and what you did, and send it to the developer.
