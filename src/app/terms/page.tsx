// src/app/terms/page.tsx
export const metadata = {
  title: 'Terms and Conditions | Spookify My Art',
  description: 'Legal terms for using the Spookify My Art service',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 opacity-100 bg-white text-gray-800 dark:bg-zinc-900 dark:text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-orange-600 dark:text-orange-400">
          Terms & Conditions
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Last updated: 17 October 2025</p>
      </header>

      <article className="[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-gray-900 [&>h2]:dark:text-white [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:mb-4 [&_ul]:mb-4 [&_ul_li]:mb-1">
        <p>
          Welcome to <strong>Spookify My Art</strong> (the “Service”), operated on the{' '}
          <strong>aigifts.org</strong> website (the “Site”). By using our Site and Services, you agree to the
          terms below. If you do not agree, please do not use the Service.
        </p>

        <h2>Definitions / Who we are</h2>
        <p>
          “We”, “us”, “our” means <strong>Kathryn Lamb</strong> trading as <strong>Spookify My Art</strong>,
          operating via the AI Gifts website at <strong>aigifts.org</strong>. “You” or “customer” means the
          person placing an order or using the Service.
        </p>

        <h2>1) Business Information</h2>
        <p>
          Trading name: <strong>Spookify My Art</strong><br />
          Owner: <strong>Kathryn Lamb</strong><br />
          Registered/Trading address: Manor House, Eaglescliffe, TS16 0QT, United Kingdom<br />
          Primary contact: <a href="mailto:support@aigifts.org" className="underline text-orange-700 dark:text-orange-300">support@aigifts.org</a>
        </p>

        <h2>2) What We Do</h2>
        <p>
          We transform customer-supplied artwork/photos into a Halloween-themed “spookified” version. You can
          receive digital files and/or order printed items that are <strong>made-to-order</strong> and fulfilled
          by our production partner <em>Gelato</em>.
        </p>

        <h2>3) Eligibility & Your Content</h2>
        <ul className="list-disc list-inside">
          <li>You confirm you own the rights to any images you upload, or have permission to use them.</li>
          <li>You won’t upload unlawful, explicit, infringing or hateful content.</li>
          <li>
            You grant us a limited license to edit, process and print your image solely to fulfil your order and
            to provide support. We may showcase anonymised examples unless you opt out by emailing us.
          </li>
          <li>You must be 18+ or have permission of a parent/guardian to place an order.</li>
        </ul>

        <h2>4) Prices, Currency & Payment</h2>
        <p>
          All prices are shown in GBP (£). Payments are processed securely by Stripe. Orders are accepted once
          payment is successfully authorised. Taxes, duties and shipping (where applicable) are shown at checkout.
          If your card issuer charges foreign exchange or bank fees, those are your responsibility.
        </p>

        <h2>5) Production, Shipping & Delivery</h2>
        <ul className="list-disc list-inside">
          <li>Digital items are delivered by email/download once processing is complete.</li>
          <li>
            Printed items are produced on demand by Gelato and shipped from the closest production partner
            (UK, EU, US, CA, AU, NZ and other regions where available).
          </li>
          <li>Typical production is 1–4 business days; shipping time depends on destination and method (estimates, not guarantees).</li>
          <li>International shipments may incur local taxes/duties on delivery, payable by the customer.</li>
          <li>We’re not responsible for courier delays, missed deliveries, or customs inspections.</li>
        </ul>

        <h2>6) Cancellations, Returns & Refunds</h2>
        <p className="mb-2"><strong>Digital services/files</strong></p>
        <ul className="list-disc list-inside">
          <li>Cancellation is only possible <em>before</em> we start work. Email <a className="underline text-orange-700 dark:text-orange-300" href="mailto:support@aigifts.org">support@aigifts.org</a> immediately.</li>
          <li>Delivered digital files are non-refundable unless there is a technical defect we cannot reasonably resolve.</li>
        </ul>

        <p className="mt-4 mb-2"><strong>Printed (made-to-order) items — Gelato</strong></p>
        <ul className="list-disc list-inside">
          <li>
            Because items are personalised and produced on demand, <strong>change-of-mind returns</strong> are not
            accepted once production starts (customised goods exemption under UK law).
          </li>
          <li>
            If an item arrives damaged, defective, misprinted or materially incorrect, we’ll <strong>reprint</strong> it at no charge.
            If a reprint isn’t possible, we’ll refund you.
          </li>
          <li>
            Contact us within <strong>14 days of delivery</strong> with your order number and clear photos of the
            product and packaging so we can assess with Gelato.
          </li>
          <li>
            Minor colour variance, small alignment tolerances, or issues caused by low-resolution/poor uploads are
            not considered defects.
          </li>
        </ul>

        <p className="mt-4">
          To request a cancellation (if work hasn’t started) or to report a defect, email{' '}
          <a href="mailto:support@aigifts.org" className="underline text-orange-700 dark:text-orange-300">support@aigifts.org</a>.
        </p>

        <h2>7) Intellectual Property</h2>
        <p>
          You retain rights to your original images and the personalised output. We retain rights in our styles,
          prompts, methods and tooling. Our brand assets and Site content are protected by IP laws.
        </p>

        <h2>8) Acceptable Use & Suspension</h2>
        <p>
          We may refuse or cancel orders that breach these terms or applicable law. If we cancel before
          production/work begins, we will refund you. If we cancel because of a policy breach discovered
          after work begins, we may withhold a reasonable amount for work already performed.
        </p>

        <h2>9) Liability</h2>
        <p>
          To the maximum extent permitted by law, we’re not liable for indirect or consequential losses, courier delays,
          or customs charges. Our total liability per order is limited to the amount paid for that order.
        </p>

        <h2>10) Privacy</h2>
        <p>
          We collect only what’s needed to fulfil your order and support you. Payments are handled by Stripe;
          we don’t store full card details. See our{' '}
          <a href="/privacy" className="underline text-orange-700 dark:text-orange-300">Privacy Policy</a>.
        </p>

        <h2>11) Governing Law</h2>
        <p>These terms are governed by the laws of England & Wales. Courts of England & Wales have exclusive jurisdiction.</p>

        <h2>12) Contact</h2>
        <p>
          Questions or complaints? Email <a href="mailto:support@aigifts.org" className="underline text-orange-700 dark:text-orange-300">support@aigifts.org</a>.
        </p>
      </article>
    </main>
  )
}
