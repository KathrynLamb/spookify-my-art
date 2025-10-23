import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Env you need to set (example using Gmail/SMTP or your provider):
 * - SMTP_HOST=smtp.gmail.com
 * - SMTP_PORT=465
 * - SMTP_SECURE=true
 * - SMTP_USER=youremail@example.com
 * - SMTP_PASS=app_password_or_smtp_pass
 * - ORDERS_TO=katylamb2000@gmail.com  (defaults to this if missing)
 * - ORDERS_FROM=orders@aigifts.org    (fallbacks to SMTP_USER)
 */
function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      fileUrl,
      imageId,
      product,
      sizeLabel,
      orientation,
      frameColor,
      currency,
    } = body as {
      email: string;
      fileUrl: string;
      imageId?: string;
      product: string;
      sizeLabel: string;
      orientation: string;
      frameColor?: string | null;
      currency?: string;
    };

    if (!email || !fileUrl || !product || !sizeLabel || !orientation) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const to = process.env.ORDERS_TO || 'support@aigifts.org';
    const from =
      process.env.ORDERS_FROM || process.env.SMTP_USER || 'orders@aigifts.org';

    const subject = `🧾 Spookify manual order: ${product} – ${sizeLabel} – ${orientation}${frameColor ? ` – ${frameColor}` : ''}`;

    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <h2>New manual order</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Product:</strong> ${product}</p>
        <p><strong>Size:</strong> ${sizeLabel}</p>
        <p><strong>Orientation:</strong> ${orientation}</p>
        ${frameColor ? `<p><strong>Frame color:</strong> ${frameColor}</p>` : ''}
        ${currency ? `<p><strong>Currency:</strong> ${currency}</p>` : ''}
        ${imageId ? `<p><strong>Image ID:</strong> ${imageId}</p>` : ''}

        <p><strong>Artwork URL:</strong> <a href="${fileUrl}">${fileUrl}</a></p>

        <hr/>
        <p>Follow up with the customer to confirm payment and shipping details.</p>
      </div>
    `;

    const text =
      `New manual order\n\n` +
      `Email: ${email}\n` +
      `Product: ${product}\n` +
      `Size: ${sizeLabel}\n` +
      `Orientation: ${orientation}\n` +
      (frameColor ? `Frame color: ${frameColor}\n` : '') +
      (currency ? `Currency: ${currency}\n` : '') +
      (imageId ? `Image ID: ${imageId}\n` : '') +
      `Artwork URL: ${fileUrl}\n`;

    const transporter = buildTransport();

    await transporter.sendMail({
      from,
      to,
      cc: email, // CC the buyer so they get a copy
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
