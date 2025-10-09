// src/app/terms/page.tsx
export const metadata = {
    title: 'Terms and Conditions | Spookify My Art',
    description: 'Legal terms for using the Spookify My Art service',
  }
  
  export default function TermsPage() {
    return (
      <main className="max-w-3xl mx-auto p-6 text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-orange-400">Terms and Conditions</h1>
        <p className="text-sm text-gray-400 mb-2">Last updated: October 7, 2025</p>
  
        <section className="space-y-6">
          <p>
            Welcome to <strong>Spookify My Art</strong>. By using this website and our services,
            you agree to the following Terms and Conditions. Please read them carefully before placing an order.
          </p>
  
          <h2 className="text-xl font-semibold text-white">1. About Us</h2>
          <p>
            This site is owned and operated by:
            <br />
            <strong>Kathryn Lamb</strong>
            <br />
            Manor House, Eaglescliffe, TS16 0QT
            <br />
            Trading as <strong>Spookify My Art</strong>
            <br />
            Email: <a href="mailto:katylamb@gmail.com" className="underline text-orange-300">katylamb@gmail.com</a>
          </p>
  
          <h2 className="text-xl font-semibold text-white">2. Service Overview</h2>
          <p>
            We offer a service where customers upload images of their existing wall art or photos,
            and we return a Halloween-themed “spookified” version, optionally available for printing.
          </p>
  
          <h2 className="text-xl font-semibold text-white">3. Ordering Process</h2>
          <p>By placing an order, you confirm that:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>You own or have rights to use the uploaded image</li>
            <li>The image does not include explicit, illegal, or infringing content</li>
            <li>You grant us a temporary license to modify and use your image for your order only</li>
          </ul>
  
          <h2 className="text-xl font-semibold text-white">4. Pricing & Payment</h2>
          <p>
            All prices are in GBP (£). We accept secure payment via Stripe. Orders are processed
            after successful payment.
          </p>
  
          <h2 className="text-xl font-semibold text-white">5. Shipping & Delivery</h2>
          <p>
            Printed items are fulfilled by Gelato. We ship to:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>UK, Ireland, EU countries</li>
            <li>USA, Canada, Australia, New Zealand</li>
          </ul>
          <p>Delivery times vary and are estimates only.</p>
  
          <h2 className="text-xl font-semibold text-white">6. Refunds & Returns</h2>
          <p>
            We offer refunds or replacements within 14 days only if:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>The product is damaged or defective</li>
            <li>There was an error by us or our print/shipping partner</li>
          </ul>
          <p>
            No refunds are given for personal preferences, low-resolution uploads, or courier delays.
          </p>
  
          <h2 className="text-xl font-semibold text-white">7. Intellectual Property</h2>
          <p>
            You retain rights to your original image and generated artwork. We may showcase anonymized
            examples unless you opt out.
          </p>
  
          <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
          <p>
            We’re not liable for indirect damages, delays caused by third parties, or misuse of products.
          </p>
  
          <h2 className="text-xl font-semibold text-white">9. Privacy</h2>
          <p>
            We only collect the minimum data needed to fulfill your order (image, shipping info, email).
            No data is sold or shared. Payments are processed securely via Stripe.
            Read our <a href="/privacy" className="underline text-orange-300">Privacy Policy</a> for details.
          </p>
  
          <h2 className="text-xl font-semibold text-white">10. Governing Law</h2>
          <p>These terms are governed by the laws of England and Wales.</p>
  
          <h2 className="text-xl font-semibold text-white">11. Contact</h2>
          <p>
            For support, contact:
            <br />
            Kathryn Lamb – <a href="mailto:katylamb@gmail.com" className="underline text-orange-300">katylamb@gmail.com</a>
          </p>
        </section>
      </main>
    )
  }
  