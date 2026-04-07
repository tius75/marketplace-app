import { NextResponse } from 'next/server';
const midtransClient = require('midtrans-client');

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, grossAmount, customerDetails } = body;

    const snap = new midtransClient.Snap({
      isProduction: true, // WAJIB TRUE karena Anda pakai Production Key
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customerDetails.name,
        phone: customerDetails.phone,
        billing_address: {
          address: customerDetails.address
        }
      }
    };

    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ token: transaction.token });

  } catch (error) {
    console.error("Midtrans Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}