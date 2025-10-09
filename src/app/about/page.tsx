'use client'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-orange-500">About Spookify My Art</h1>
      <p className="mb-6 text-lg text-gray-300">
        Welcome to <strong>Spookify My Art</strong> {`— the magical way to transform your everyday wall art into hauntingly delightful Halloween decor. Whether it’s a family photo, a peaceful landscape, or your child’s artwork, we turn it into a spooky seasonal version perfect for decorating your home.`}
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2 text-purple-400">Who We Are</h2>
      <p className="mb-4 text-gray-300">
        Spookify My Art was created by Kathryn Lamb in the UK with one goal: to help you add eerie charm to your home during the Halloween season — without buying a load of plastic. Simply upload your existing wall art or family photo, tell us your spooky vision, and let our AI do the rest. We even offer printed posters for delivery.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2 text-purple-400">Our Mission</h2>
      <p className="mb-4 text-gray-300">
        We believe Halloween should be fun, expressive, and creative — not expensive or wasteful. Our prints let you temporarily swap out your existing art with spooky seasonal versions that surprise and delight.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2 text-purple-400">Get in Touch</h2>
      <p className="mb-4 text-gray-300">
        Have questions or ideas? {`We'd love to hear from you.`} Email us at{' '}
        <a href="mailto:katylamb@gmail.com" className="text-orange-400 underline">katylamb@gmail.com</a>.
      </p>

      <p className="text-sm text-gray-500 mt-10">
        Spookify My Art is operated by Kathryn Lamb, Manor House, Eaglescliffe, TS16 0QT, UK.
      </p>
    </main>
  )
}
