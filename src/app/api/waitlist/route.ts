import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, productTitle, productUID } = await req.json();

  // TODO: Change to your real email service
  console.log("Waitlist signup:", { email, productTitle, productUID });

  // Example: send via Resend, Postmark, SendGrid, etc.
  // await resend.emails.send({...})

  return NextResponse.json({ ok: true });
}
