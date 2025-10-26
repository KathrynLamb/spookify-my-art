






// src/app/returns/page.tsx
export const metadata = {
    title: 'Refund & Returns Policy | Spookify My Art',
    description: 'Our policy for damaged or defective print orders',
    }
    
    
    export default function ReturnsPage() {
    return (
    <main className="max-w-3xl mx-auto p-6 text-gray-200">
    <h1 className="text-3xl font-bold mb-6 text-orange-400">Refund & Returns Policy</h1>
    <p className="text-sm text-gray-400 mb-2">Last updated: October 7, 2025</p>
    
    
    <section className="space-y-6">
    <p>
    We want you to love your spooky art. If something goes wrong, we’re here to help.
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">1. Damaged or Defective Orders</h2>
    <p>
    {`If your product arrives damaged or with a manufacturing error, please contact us within 14 days of receipt. We'll offer a full refund or replacement.`}
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">2. Non-Refundable Items</h2>
    <ul className="list-disc list-inside pl-4 space-y-1">
    <li>Orders with user-uploaded low-quality images</li>
    <li>Orders based on incorrect address or info provided by you</li>
    <li>Delays caused by third-party couriers</li>
    </ul>
    
    
    <h2 className="text-xl font-semibold text-white">3. How to Request a Refund</h2>
    <p>
    Email us at <a href="mailto:katylamb@gmail.com" className="underline text-orange-300">support@aigifts.org</a> with your order number, issue details, and a photo of the issue.
    </p>
    
    
    <h2 className="text-xl font-semibold text-white">4. Contact</h2>
    <p>
    Kathryn Lamb<br />
    Manor House, Eaglescliffe, TS16 0QT
    </p>
    </section>
    </main>
    )
    }