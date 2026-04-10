# Razorpay Integration Guide & Architecture

Welcome to the internal learning document on how the VidyaHeist platform handles payments via Razorpay.

## Overview
Razorpay replaces the old manual UTR flow with a secure, automated checkout procedure. This ensures that every sale is immediately fulfilled without the need for manual approval, while retaining 100% cryptographic security.

## The Payment Flow

1. **User Initiates Checkout**: By clicking "Pay ₹XXX", the client sends a POST request to `/api/razorpay/order`.
2. **Server Generates Order**: The backend communicates with Razorpay via an API Secret Key to create an exclusive `order_id`. This prevents users from altering price points via browser devtools.
3. **Draft the Purchase**: A placeholder purchase document is created in Firestore with `status: pending`.
4. **Client Completes Payment**: Razorpay Checkout is loaded dynamically using NextJS `<Script>` and launched with the generated `order_id`.
5. **Server Verification**: The successful transaction details (`razorpay_payment_id`, `razorpay_signature`) are sent back to the server `/api/razorpay/verify`.
6. **Fulfillment**: The server cryptographically validates the signature. If authentic, it utilizes `firebase-admin` (bypassing Client Firestore Rules) to instantly update the user's purchase document to `status: success`.

## 100% Secure Architecture
Why couldn't this be safely implemented entirely on the frontend?

Because our `firestore.rules` rightfully block clients from updating existing `/purchases/` documents to prevent cheating. Only Admins can modify a purchase's state. 
The Firebase Client SDK is inherently constrained by these rules. The **Firebase Admin SDK** is initialized server-side in our API route. Once the payment signature is mathematically verified using the SHA256 HMAC of the secret, the server uses its Admin authority to finalize the document.

### How Signature Verification Works
```typescript
const generated_signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(order_id + "|" + payment_id)
  .digest("hex");

if (generated_signature !== received_signature) throw new Error();
```
This is computationally impossible to spoof without knowing `RAZORPAY_KEY_SECRET`. 

## How to add this in Production
Currently, the integration utilizes Test Mode API Keys. To go live:
1. Generate **Live API Keys** from the Razorpay Dashboard.
2. Update `.env.local` (or your host's environment settings) with the Live Keys:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx`
   - `RAZORPAY_KEY_SECRET=xxxxxxxxx`
3. Generate a **Firebase Service Account Key JSON** from your Firebase Console > Project Settings > Service Accounts.
4. Convert those Google credentials into standard `.env` variables and update your hosting environment variables:
   - `FIREBASE_PROJECT_ID=vidyaheist`
   - `FIREBASE_CLIENT_EMAIL=...`
   - `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."`
5. Test it thoroughly using a live payment of ₹1.

## Maintenance and Best Practices
1. **Never expose the Secret Key**: Ensure `RAZORPAY_KEY_SECRET` never includes `NEXT_PUBLIC_` so it doesn't bundle onto the frontend.
2. **Keep Dependencies updated**: Run `npm update razorpay firebase-admin` every few months.
3. **Webhooks Setup**: As a future upgrade, consider setting up a dedicated Razorpay Webhook instead of trusting the browser to pass the signature. If a user's network drops during step 5, their payment goes through but their `purchase` is left "pending". Webhooks ensure 100% redundancy globally behind-the-scenes. You'd point a Razorpay Webhook directly to an endpoint like `/api/webhooks/razorpay`.
