"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  type: "contacts" | "companies";
  itemIds: string[];
  itemCount: number;
  pricePerItem: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalOrderData {
  purchase_units: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function PayPalPayment({
  amount,
  currency = "USD",
  type,
  itemIds,
  itemCount,
  pricePerItem,
  onSuccess,
  onError,
  onCancel,
}: PayPalPaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const paypalButtonContainerRef = useRef(null as HTMLDivElement | null);
  const paypalLoadedRef = useRef(false);
  const initializationStartedRef = useRef(false);
  const orderDataRef = useRef(null as PayPalOrderData | null);
  const invoiceNumberRef = useRef(null as string | null);

  function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    const storedState = localStorage.getItem("authState");
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        if (parsed?.token) return parsed.token as string;
      } catch (error) {
        console.error("Failed to parse authState", error);
      }
    }
    return localStorage.getItem("authToken") || localStorage.getItem("token");
  }

  useEffect(() => {
    // Prevent double initialization (React StrictMode mounts twice in dev)
    if (initializationStartedRef.current) return;
    initializationStartedRef.current = true;

    const loadPayPalScript = () => {
      if (window.paypal || paypalLoadedRef.current) {
        initializePayPal();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID"}&currency=${currency}`;
      script.async = true;
      script.onload = () => {
        paypalLoadedRef.current = true;
        initializePayPal();
      };
      script.onerror = () => {
        setError("Failed to load PayPal SDK");
        setIsLoading(false);
      };
      document.body.appendChild(script);
    };

    const initializePayPal = async () => {
      if (!window.paypal || !paypalButtonContainerRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error("Authentication required. Please sign in again.");
        }

        // Create order on backend
        const response = await fetch("/api/customers/payment/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            type,
            itemIds,
            itemCount,
            pricePerItem,
            currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create order");
        }

        const data = await response.json();
        invoiceNumberRef.current = data.invoiceNumber;
        orderDataRef.current = data.orderData;

        // Render PayPal buttons
        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
            },
            createOrder: async (_data: any, actions: any) => {
              if (!orderDataRef.current) {
                throw new Error("Missing order data");
              }
              return actions.order.create(orderDataRef.current);
            },
            onApprove: async (data: any, actions: any) => {
              try {
                const order = await actions.order.capture();
                
                // Get invoiceNumber from ref to ensure we have the latest value
                const currentInvoiceNumber = invoiceNumberRef.current;
                if (!currentInvoiceNumber) {
                  throw new Error("Invoice number not found. Please try again.");
                }
                
                // Determine payment status from PayPal order
                let paymentStatus = "pending";
                if (order.status === "COMPLETED") {
                  paymentStatus = "completed";
                } else if (order.status === "PENDING") {
                  paymentStatus = "pending";
                } else if (order.status === "FAILED" || order.status === "CANCELLED") {
                  paymentStatus = "failed";
                }
                
                // Verify payment on backend (save status for all outcomes)
                const verifyResponse = await fetch("/api/customers/payment/verify-payment", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                  },
                  body: JSON.stringify({
                    invoiceNumber: currentInvoiceNumber,
                    paymentId: order.id,
                    payerId: order.payer?.payer_id,
                    payerEmail: order.payer?.email_address,
                    transactionId: order.purchase_units[0]?.payments?.captures?.[0]?.id,
                    paymentStatus,
                    type,
                    itemIds,
                    itemCount,
                    pricePerItem,
                    currency,
                  }),
                });

                if (!verifyResponse.ok) {
                  const errorData = await verifyResponse.json();
                  throw new Error(errorData.message || "Payment verification failed");
                }

                const verifyData = await verifyResponse.json();
                
                // Only call onSuccess for completed payments
                if (paymentStatus === "completed") {
                onSuccess({
                  ...order,
                  invoice: verifyData.invoice,
                });
                } else if (paymentStatus === "failed") {
                  onError("Payment failed. Please try again.");
                } else {
                  // Pending payment
                  onError("Payment is pending. Please wait for confirmation.");
                }
              } catch (err: any) {
                // Save failed payment status to backend
                const currentInvoiceNumber = invoiceNumberRef.current;
                if (currentInvoiceNumber) {
                  try {
                    await fetch("/api/customers/payment/verify-payment", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                      },
                      body: JSON.stringify({
                        invoiceNumber: currentInvoiceNumber,
                        paymentStatus: "failed",
                        type,
                        itemIds,
                        itemCount,
                        pricePerItem,
                        currency,
                        errorMessage: err.message || "Payment processing failed",
                      }),
                    });
                  } catch (saveError) {
                    console.error("Failed to save failed payment status:", saveError);
                  }
                }
                onError(err.message || "Payment verification failed");
              }
            },
            onCancel: async () => {
              // Save cancelled payment with cancelled status
              const currentInvoiceNumber = invoiceNumberRef.current;
              if (currentInvoiceNumber) {
                try {
                  await fetch("/api/customers/payment/verify-payment", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                      invoiceNumber: currentInvoiceNumber,
                      paymentStatus: "cancelled",
                      type,
                      itemIds,
                      itemCount,
                      pricePerItem,
                      currency,
                      errorMessage: "Payment was cancelled by user",
                    }),
                  });
                } catch (saveError) {
                  console.error("Failed to save cancelled payment status:", saveError);
                }
              }
              if (onCancel) {
                onCancel();
              }
            },
            onError: async (err: any) => {
              setError(err.message || "PayPal payment error");
              
              // Save failed payment status to backend
              const currentInvoiceNumber = invoiceNumberRef.current;
              if (currentInvoiceNumber) {
                try {
                  await fetch("/api/customers/payment/verify-payment", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                      invoiceNumber: currentInvoiceNumber,
                      paymentStatus: "failed",
                      type,
                      itemIds,
                      itemCount,
                      pricePerItem,
                      currency,
                      errorMessage: err.message || "PayPal payment error",
                    }),
                  });
                } catch (saveError) {
                  console.error("Failed to save failed payment status:", saveError);
                }
              }
              
              onError(err.message || "PayPal payment error");
            },
          })
          .render(paypalButtonContainerRef.current);

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to initialize PayPal");
        setIsLoading(false);
        onError(err.message || "Failed to initialize PayPal");
      }
    };

    loadPayPalScript();

    return () => {
      // Cleanup if needed
    };
  }, [amount, currency, type, itemIds, itemCount, pricePerItem]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#EF8037] mb-4" />
          <p className="text-gray-600">Loading PayPal...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div ref={paypalButtonContainerRef} className="w-full" />
    </div>
  );
}

