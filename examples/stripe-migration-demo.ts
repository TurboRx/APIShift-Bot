// APIShift Automated AST Migration Example Output
import stripe from 'stripe';

interface ChargeParams {
  amount: number;
  payment_method: string;
}

export async function processPayment(card: string) {
  const result = await stripe.paymentIntents.create({
    amount: 5000,
    payment_method: card
  });
  const endpoint = '/v1/payment_intents/' + result.id;
  return fetch(endpoint);
}
