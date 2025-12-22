"use client";

//TODO: Este form deberia reemplazarse con el Embedded checkout de stripe,
// esta facil de setear pero no pude hacerlo porqaue necesita una ruta del back
// aca te dejo el enlace a la docu igual https://docs.stripe.com/checkout/embedded/quickstart

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

interface PaymentFormProps {
  amount: number;
  onSubmit: (paymentInfo: any) => void; //Seria el tipo de dato de información a subir
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSubmit }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      return;
    }

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: name,
          email: email,
        },
      });

      if (error) {
        console.error("[error]", error);
        alert(`Error: ${error.message}`);
        return;
      }

      onSubmit({
        success: true,
        amount: amount,
        paymentMethodId: paymentMethod?.id,
        email: email,
        name: name,
      });
    } catch (error) {
      console.error("[error]", error);
      alert("Error processing payment");
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre completo
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre completo"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Información de la tarjeta
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={!stripe}
          className="w-full py-6 text-lg"
        >
          Proceder con el pago
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
