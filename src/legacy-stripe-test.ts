import stripe from 'stripe';

interface ChargeParams {
  amount: number;
  card: string;
}

export async function processPayment(card: string) {
  const result = await stripe.charges.create({
    amount: 5000,
    card,
  });
  const endpoint = '/v1/charges/' + result.id;
  return fetch(endpoint);
}
