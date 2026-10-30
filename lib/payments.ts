// Camada de pagamento SIMULADA. Para produção, troque o corpo destas funções
// por chamadas ao seu servidor, que fala com o gateway (Mercado Pago, Stripe,
// Asaas...). Nunca coloque chaves secretas do gateway dentro do app.

export type PixCharge = { id: string; copiaECola: string; expiresInSeconds: number };

export async function createPixCharge(amount: number, description: string): Promise<PixCharge> {
  await wait(600);
  const id = Math.random().toString(36).slice(2, 10).toUpperCase();
  return {
    id,
    copiaECola: `00020126-SIMULADO-${id}-${amount.toFixed(2)}-${description.length}`,
    expiresInSeconds: 600,
  };
}

export async function confirmPixPayment(_chargeId: string): Promise<boolean> {
  await wait(900);
  return true;
}

export async function payWithCard(_amount: number, _last4: string): Promise<boolean> {
  await wait(1200);
  return true;
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
