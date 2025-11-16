// paymentService.ts
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe("pk_live_51OH7QBEaNbJFWzSSzsO1wsvWMFzITvS3qn195uDKwSiDQ6Y85Vm9yCMfzWMnpmcMTXhHWLalN3Xx49Bv7H4FyOzF00FHnrOF7v");


/**
 * Initialize Stripe and Elements
 * @param clientSecret - The client secret from the payment intent
 * @param item - The item to be purchased
 */
export const initializeStripe = async (clientSecret: string, item: any) => {
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