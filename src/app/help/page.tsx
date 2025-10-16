// src/app/help/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support | Spookify My Art",
  description:
    "Support, delivery times, returns and refunds for Spookify My Art posters and prints.",
};

const email = "support@aigifts.com"; // ✅ update if you prefer a different inbox
const businessName = "Spookify My Art";
const siteHost = "aigifts.org";

export default function HelpPage() {
  const faq = [
    {
      q: "What do you sell?",
      a: `${businessName} creates custom Halloween-themed posters/prints from a photo you upload. You pick size and finish, and we print and ship to your address.`,
    },
    {
      q: "How does the ordering process work?",
      a: "1) Upload a photo, 2) choose your product and size, 3) complete checkout. We’ll process your artwork and submit it to print. You’ll receive order confirmation by email.",
    },
    {
      q: "How long will delivery take?",
      a: "Typical production is 1–3 business days, plus shipping of 2–7 business days depending on destination. Total estimated time: 3–10 business days. You’ll get a tracking link when available.",
    },
    {
      q: "Do you ship internationally?",
      a: "Yes. Most countries are supported. Shipping fees and taxes (if applicable) are shown at checkout before payment.",
    },
    {
      q: "Can I cancel or change my order?",
      a: "We can usually cancel or update within a short window before the print starts. Email us ASAP at support@aigifts.org with your order number and the requested change. If the order has already gone to production, we’re unable to cancel.",
    },
    {
      q: "What’s your return & refund policy?",
      a: "Because each print is custom, we cannot accept returns for change of mind or user-provided artwork issues (e.g., low-res or dark images). If your order arrives damaged, defective, or incorrect, contact us within 14 days of delivery with photos. We’ll reprint or refund according to the issue.",
    },
    {
      q: "My print arrived damaged or with a print defect—what should I do?",
      a: "Email support@aigifts.org within 14 days with photos of the packaging and the damage/defect plus your order number. We’ll sort a free replacement or refund.",
    },
    {
      q: "How are taxes handled?",
      a: "Applicable taxes are calculated at checkout based on your shipping country/region. For some locations, our commerce provider remits taxes on our behalf.",
    },
    {
      q: "Can I get an invoice/receipt?",
      a: "Yes—your order confirmation email includes a receipt. If you need a VAT/GST invoice, reply to the email or contact support@aigifts.org with your order number and billing details.",
    },
    {
      q: "Which payment methods do you accept?",
      a: "Major debit/credit cards and additional local methods where available. Payments are processed securely by our commerce provider.",
    },
    {
      q: "How do I contact support?",
      a: "Email us at support@aigifts.org. We reply Mon–Fri, 9:00–17:00 UK time, usually within 1 business day.",
    },
    {
      q: "Do you store my photos?",
      a: "We store the image you upload only to generate your artwork and fulfil printing. See our Privacy Policy for details and retention periods.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-white/70 mb-8">
          Need a hand? The fastest way to reach us is by email. We aim to reply
          within one business day.
        </p>

        {/* Contact block */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <ul className="space-y-1 text-white/90">
            <li>
              Email:{" "}
              <a
                className="underline hover:text-orange-300"
                href={`mailto:${email}`}
              >
                {email}
              </a>
            </li>
            <li>Hours: Mon–Fri, 09:00–17:00 (UK time)</li>
            <li>Response time: within 1 business day</li>
          </ul>
        </section>

        {/* Key facts (Stripe-friendly) */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
          <h2 className="text-xl font-semibold mb-3">Key information</h2>
          <ul className="space-y-2 list-disc pl-5 text-white/90">
            <li>
              <span className="font-medium">Business name:</span>{" "}
              {businessName}
            </li>
            <li>
              <span className="font-medium">Website:</span> https://{siteHost}
            </li>
            <li>
              <span className="font-medium">What we sell:</span> custom posters
              and prints produced from customer-supplied photos.
            </li>
            <li>
              <span className="font-medium">Delivery estimate:</span>{" "}
              3–10 business days (production + shipping, varies by region).
            </li>
            <li>
              <span className="font-medium">Refunds/returns:</span> custom items
              are non-returnable except for damage, defects, or wrong item.
              Report issues within 14 days of delivery with photos.
            </li>
            <li>
              <span className="font-medium">Cancellations:</span> possible only
              before production starts—email immediately with your order number.
            </li>
            <li>
              <span className="font-medium">Taxes:</span> calculated at
              checkout; may be collected/remitted by our commerce provider.
            </li>
            <li>
              <span className="font-medium">Support:</span>{" "}
              <a className="underline" href={`mailto:${email}`}>
                {email}
              </a>{" "}
              (primary contact method).
            </li>
          </ul>
        </section>

        {/* Policy links */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
          <h2 className="text-xl font-semibold mb-3">Policies</h2>
          <ul className="space-y-2 text-white/90 underline underline-offset-4">
            <li>
              <a href="/terms">Terms of Service</a>
            </li>
            <li>
              <a href="/privacy">Privacy Policy</a>
            </li>
            <li>
              <a href="/returns">Returns & Refunds</a>
            </li>
            <li>
              <a href="/support">Contact & Complaints</a>
            </li>
          </ul>
        </section>

        {/* FAQs (semantic <details>) */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-3">FAQs</h2>
          <div className="space-y-2">
            {faq.map((f, i) => (
              <details
                key={i}
                className="group rounded-lg border border-white/10 bg-white/5"
              >
                <summary className="cursor-pointer select-none list-none px-4 py-3 font-medium marker:hidden group-open:bg-white/10">
                  {f.q}
                </summary>
                <div className="px-4 pb-4 text-white/90">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Accessibility & data notes */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold mb-2">Accessibility & data</h2>
          <p className="text-white/90">
            We’re committed to accessible service. If you need assistance using
            the site or require an alternative format, contact us at{" "}
            <a className="underline" href={`mailto:${email}`}>
              {email}
            </a>
            . We process your personal data to fulfill your order and provide
            support—see our{" "}
            <a className="underline" href="/privacy">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </div>

      {/* FAQ rich results */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
