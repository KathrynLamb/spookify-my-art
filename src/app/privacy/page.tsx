// src/app/privacy/page.tsx
export const metadata = {
    title: 'Privacy Policy | Spookify My Art',
    description: 'How we collect and use your data at Spookify My Art',
    }
    
    
    export default function PrivacyPage() {
    return (
    <main className="max-w-3xl mx-auto p-6 text-gray-200">
    <h1 className="text-3xl font-bold mb-6 text-orange-400">Privacy Policy</h1>
    <p className="text-sm text-gray-400 mb-2">Last updated: October 7, 2025</p>
    
    
    <section className="space-y-6">
    <p>
    Your privacy matters. We collect and use only what we need to deliver your spooky prints:
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">1. What We Collect</h2>
    <ul className="list-disc list-inside pl-4 space-y-1">
    <li>Uploaded images (for art transformation only)</li>
    <li>Email address (to send order confirmations)</li>
    <li>Shipping details (for delivery via Gelato)</li>
    </ul>
    
    
    <h2 className="text-xl font-semibold text-white">2. How We Use It</h2>
    <p>
    We use your data to:
    </p>
    <ul className="list-disc list-inside pl-4 space-y-1">
    <li>Create your spookified art</li>
    <li>Deliver physical products to you</li>
    <li>Support your order or respond to inquiries</li>
    </ul>
    
    
    <h2 className="text-xl font-semibold text-white">3. Sharing</h2>
    <p>
    We do not sell or share your data. We use Stripe for payments and Gelato for printing/shipping.
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">4. Cookies & Tracking</h2>
    <p>
    We use minimal cookies for functionality. No ad tracking.
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">5. Deletion</h2>
    <p>
    Contact us at <a href="mailto:support@aigifts.org" className="underline text-orange-300">support@aigifts.org</a> to request deletion of your data.
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">6. Contact</h2>
    <p>
    Kathryn Lamb<br />
    Manor House, Eaglescliffe, TS16 0QT
    </p>
    </section>
    </main>
    )
    }