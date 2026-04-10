import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt } = body;

    // Ensure amount is a rounded integer (paise) as Razorpay does not accept decimals
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    // Return detailed error message if available from Razorpay
    const detailMessage = error.error?.description || error.message || "Unknown error";
    return NextResponse.json(
      { error: "Failed to create order", details: detailMessage },
      { status: 500 }
    );
  }
}
