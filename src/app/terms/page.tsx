// src/app/terms/page.tsx
export const metadata = {
  title: 'Terms and Conditions | Spookify My Art',
  description: 'Legal terms for using the Spookify My Art service',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-gray-100 leading-relaxed">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-orange-400">Terms & Conditions</h1>
        <p className="mt-1 text-sm text-gray-400">Last updated: 17 October 2025</p>
      </header>

      <article className="[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:mb-4 [&_ul]:mb-4 [&_ul_li]:mb-1">
        <p>
          Welcome to <strong>Spookify My Art</strong>. By using our website and services, you agree to the
          terms below. If you do not agree, please do not use the service.
        </p>

        <h2>1) About Us</h2>
        <p>
          Trading name: <strong>Spookify My Art</strong><br />
          Owner: <strong>Kathryn Lamb</strong><br />
          Registered/Trading address: Manor House, Eaglescliffe, TS16 0QT, United Kingdom<br />
          Contact email: <a href="mailto:support@aigifts.org" className="underline text-orange-300">support@aigifts.org</a>
        </p>

        <h2>2) What We Do</h2>
        <p>
          We transform customer-supplied artwork/photos into a Halloween-themed “spookified” version. You can
          receive digital files, and/or order printed items that are <strong>made-to-order</strong> and fulfilled
          by our print partner <em>Gelato</em>.
        </p>

        <h2>3) Eligibility & Your Content</h2>
        <ul className="list-disc list-inside">
          <li>You confirm you own the rights to any images you upload, or have permission to use them.</li>
          <li>You won’t upload unlawful, explicit, infringing or hateful content.</li>
          <li>
            You grant us a limited license to edit, process and print your image solely to fulfil your order and
            to provide support. We may showcase anonymised examples unless you opt out by emailing us.
          </li>
        </ul>

        <h2>4) Prices, Currency & Payment</h2>
        <p>
          All prices are shown in GBP (£). Payments are processed securely by Stripe. Orders are accepted once
          payment is successfully authorised. Taxes, duties and shipping (where applicable) are shown at checkout.
        </p>

        <h2>5) Production, Shipping & Delivery</h2>
        <ul className="list-disc list-inside">
          <li>Digital items are delivered by email/download once processing is complete.</li>
          <li>
            Printed items are produced on demand by Gelato and shipped from the closest production partner
            (UK, EU, US, CA, AU, NZ and other regions where available).
          </li>
          <li>
            Typical production is 1–4 business days; shipping time depends on destination and chosen method.
            These are estimates and not guarantees.
          </li>
          <li>
            International shipments may incur local taxes/duties on delivery, payable by the customer.
          </li>
        </ul>

        <h2>6) Cancellations, Returns & Refunds</h2>
        <p className="mb-2"><strong>Digital services/files</strong></p>
        <ul className="list-disc list-inside">
          <li>
            Because digital processing begins quickly, cancellation is only possible <em>before</em> we start work.
            Email <a href="mailto:support@aigifts.org" className="underline text-orange-300">support@aigifts.org</a> as soon as possible.
          </li>
          <li>
            Downloaded/Delivered digital files are non-refundable unless there is a technical defect we cannot resolve.
          </li>
        </ul>

        <p className="mt-4 mb-2"><strong>Printed (made-to-order) items</strong></p>
        <ul className="list-disc list-inside">
          <li>
            Printed products are personalised/made-to-order, so there is no “change-of-mind” return once production starts.
            This aligns with UK consumer law exemptions for customised goods.
          </li>
          <li>
            If an item arrives damaged, defective, misprinted or materially different from the order,
            we’ll arrange a <strong>free reprint</strong> (or refund if a reprint isn’t possible).
          </li>
          <li>
            Please contact us within <strong>14 days of delivery</strong> with your order number, a description
            of the issue, and clear photos of the item and packaging. We’ll handle the claim with Gelato.
          </li>
          <li>
            Colour variation within normal print tolerances, or issues caused by low-resolution/poor-quality uploads,
            are not considered defects.
          </li>
        </ul>

        <p className="mt-4">
          To request a cancellation (if work has not started) or to report a defect, email&nbsp;
          <a href="mailto:support@aigifts.org" className="underline text-orange-300">support@aigifts.org</a>.
        </p>

        <h2>7) Intellectual Property</h2>
        <p>
          You retain rights to your original images and the personalised output. We retain rights in any
          templates, styles and tooling used to create the effects.
        </p>

        <h2>8) Acceptable Use & Suspension</h2>
        <p>
          We may refuse or cancel orders that breach these terms or applicable law, and refund where appropriate.
        </p>

        <h2>9) Liability</h2>
        <p>
          To the maximum extent permitted by law, we’re not liable for indirect or consequential losses,
          courier delays, or charges imposed by customs. Our total liability related to an order is limited
          to the amount you paid for that order.
        </p>

        <h2>10) Privacy</h2>
        <p>
          We collect only what’s needed to fulfil your order and support you. Payments are handled by Stripe; we
          don’t store full card details. See our{' '}
          <a href="/privacy" className="underline text-orange-300">Privacy Policy</a>.
        </p>

        <h2>11) Governing Law</h2>
        <p>
          These terms are governed by the laws of England & Wales, and disputes are subject to the exclusive
          jurisdiction of the courts of England & Wales.
        </p>

        <h2>12) Contact</h2>
        <p>
          Questions or issues? Email us at{' '}
          <a href="mailto:support@aigifts.org" className="underline text-orange-300">support@aigifts.org</a>.
        </p>
      </article>
    </main>
  )
}
