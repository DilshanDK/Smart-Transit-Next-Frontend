// @ts-ignore
"use client";

import React, { useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialise Stripe with the public key from environment variables
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      //`clientSecret` is fetched from the backend via the PaymentIntent endpoint.
      clientSecret,
      //`return_url` can be omitted for client‑side only flows; we handle the result here.
      confirmParams: {
        // Provide a placeholder receipt email – replace with a real user email in production.
        receipt_email: "demo@example.com",
      },
    });
    if (error) {
      setMessage(error.message ?? "Payment failed");
    } else {
      setMessage("Payment succeeded!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={loading || !stripe}
        className="btn-primary py-2 px-4 rounded"
      >
        {loading ? "Processing…" : "Pay now"}
      </button>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
    </form>
  );
}

export default function StripePaymentPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createIntent = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`,
        {
          amount: 500, // $5.00 – adjust as needed
          currency: "usd",
        }
      );
      setClientSecret(response.data.clientSecret);
    } catch (err) {
      console.error("Failed to create payment intent", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Buy Ticket – Admin Dashboard</h2>
      {!clientSecret ? (
        <button
          onClick={createIntent}
          disabled={loading}
          className="btn-primary py-2 px-4 rounded"
        >
          {loading ? "Creating…" : "Create Payment Intent ($5)"}
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </section>
  );
}
