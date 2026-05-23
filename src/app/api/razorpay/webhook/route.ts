import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.text(); // Get raw body for signature verification
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Webhook secret not found in environment variables");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    if (!signature) {
      console.error("Missing Razorpay signature header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    console.log(`Received Razorpay Webhook Event: ${event}`);

    // Handle order.paid event
    if (event === 'order.paid') {
      const order = payload.payload.order.entity;
      const payment = payload.payload.payment.entity;
      const orderId = order.id;
      const paymentId = payment.id;

      if (adminDb) {
        // Find the purchase document with this orderId
        const purchasesRef = adminDb.collection("purchases");
        const snapshot = await purchasesRef.where("razorpay_order_id", "==", orderId).get();

        if (snapshot.empty) {
          console.warn(`No purchase document found for order_id: ${orderId}`);
          // This might happen if the webhook arrives before the client-side doc is created (unlikely but possible)
          return NextResponse.json({ received: true, warning: "Purchase document not found yet" }, { status: 200 });
        }

        // Update all matching documents (usually just one)
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
          if (doc.data().status !== 'success') {
            batch.update(doc.ref, {
              status: "success",
              razorpay_payment_id: paymentId,
              updatedAt: new Date(),
              verifiedVia: 'webhook'
            });
          }
        });

        await batch.commit();
        console.log(`Successfully updated purchase(s) for order_id: ${orderId} via webhook`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
