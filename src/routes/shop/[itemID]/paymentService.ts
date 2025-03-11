// paymentService.ts
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "$lib/config/supabaseClient";
import type { Database, Tables } from "../../../database.types";
const stripePromise = loadStripe("pk_live_51OH7QBEaNbJFWzSSzsO1wsvWMFzITvS3qn195uDKwSiDQ6Y85Vm9yCMfzWMnpmcMTXhHWLalN3Xx49Bv7H4FyOzF00FHnrOF7v");

export const loadItem = async (itemID: string) => {
    const { data, error } = await supabase
        .from("shop")
        .select("*")
        .eq("id", itemID)
        .single();

    if (error || data === null) {
        console.error(error);
        return undefined;
    }

    return data;
};

/**
 * Create a payment intent for the shop item
 * @param shopId - The ID of the shop item
 * @param userId - The ID of the user making the payment
 * @returns - The client secret for the payment intent
 */
export const createPaymentIntent = async (shopId: string, userId: string): Promise<string> => {
    const response = await fetch("https://api.couchcup.tv/create-payment-intent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            shop_id: shopId,
            user_id: userId,
        }),
    });

    const { clientSecret } = await response.json();
    return clientSecret;
};

/**
 * Initialize Stripe and Elements
 * @param clientSecret - The client secret from the payment intent
 * @param item - The item to be purchased
 */
export const initializeStripe = async (clientSecret: string, item: Tables<'shop'>) => {
    const stripe = await stripePromise;

    if (!stripe) {
        throw new Error("Stripe failed to initialize.");
    }

    const elements = stripe.elements({ clientSecret });

    const paymentRequest = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
            label: item.name,
            amount: item.price * 100, // Amount in cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
    });

    const canMakePayment = await paymentRequest.canMakePayment();
    return { stripe, elements, paymentRequest, canMakePayment };
};

export const handlePayment = async (stripe: any, elements: any) => {
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: "https://play.couchcup.tv/thankyou",
        },
    });

    if (error) {
        console.error(error);
        throw error;
    }
};