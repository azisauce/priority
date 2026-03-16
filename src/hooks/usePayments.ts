"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CreateMonthlyPaymentInput,
  MarkAsPaidInput,
  MonthSummary,
  MonthSummaryResponse,
  MonthlyPayment,
  MonthlyPaymentEntry,
  PaymentDetailResponse,
  PaymentsListResponse,
  UpdateMonthlyPaymentInput,
} from "@/types/payment";

function formatApiError(errorPayload: unknown, fallback: string) {
  if (typeof errorPayload === "string") {
    return errorPayload;
  }

  if (typeof errorPayload === "object" && errorPayload !== null && "error" in errorPayload) {
    const nestedError = (errorPayload as { error?: unknown }).error;

    if (typeof nestedError === "string") {
      return nestedError;
    }

    if (typeof nestedError === "object" && nestedError !== null) {
      const messages = Object.values(nestedError)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string" && value.length > 0);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  return fallback;
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function usePayments() {
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments");
      const payload = (await parseJsonSafely(response)) as PaymentsListResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to load payments"));
      }

      setPayments(payload?.payments ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const getPayment = useCallback(async (id: string) => {
    const response = await fetch(`/api/payments/${id}`);
    const payload = (await parseJsonSafely(response)) as PaymentDetailResponse | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to load payment"));
    }

    return payload?.payment ?? null;
  }, []);

  const createPayment = useCallback(
    async (input: CreateMonthlyPaymentInput) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as PaymentDetailResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to create payment"));
      }

      await fetchPayments();
      return payload?.payment ?? null;
    },
    [fetchPayments]
  );

  const updatePayment = useCallback(
    async (id: string, input: UpdateMonthlyPaymentInput) => {
      const response = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as PaymentDetailResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to update payment"));
      }

      await fetchPayments();
      return payload?.payment ?? null;
    },
    [fetchPayments]
  );

  const deletePayment = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/payments/${id}`, {
        method: "DELETE",
      });

      const payload = (await parseJsonSafely(response)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to delete payment"));
      }

      await fetchPayments();
    },
    [fetchPayments]
  );

  const markPaymentAsPaid = useCallback(async (paymentId: string, input: MarkAsPaidInput) => {
    const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await parseJsonSafely(response)) as
      | { entry?: MonthlyPaymentEntry; error?: unknown }
      | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to mark payment as paid"));
    }

    return payload?.entry ?? null;
  }, []);

  const getMonthSummary = useCallback(async (month: string) => {
    const response = await fetch(`/api/payments/month-summary?month=${encodeURIComponent(month)}`);
    const payload = (await parseJsonSafely(response)) as MonthSummaryResponse | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to load month summary"));
    }

    return {
      month: payload?.month ?? month,
      totalIncome: payload?.totalIncome ?? 0,
      totalExpenses: payload?.totalExpenses ?? 0,
      net: payload?.net ?? 0,
      entries: payload?.entries ?? [],
    } as MonthSummary;
  }, []);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    getPayment,
    createPayment,
    updatePayment,
    deletePayment,
    markPaymentAsPaid,
    getMonthSummary,
  };
}
