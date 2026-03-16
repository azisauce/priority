"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DebtDirection,
  DebtItem,
  DebtStatus,
  DebtSummary,
  PaymentRecord,
  PaymentStatus,
} from "@/types/debt";

type DebtDetail = DebtItem & { payments: PaymentRecord[] };

type DebtListResponse = {
  debts?: DebtItem[];
  error?: unknown;
};

type DebtDetailResponse = {
  debt?: DebtDetail;
  error?: unknown;
};

type PaymentListResponse = {
  payments?: PaymentRecord[];
  error?: unknown;
};

const emptySummary: DebtSummary = {
  total_i_owe: 0,
  total_they_owe: 0,
  net_balance: 0,
  upcoming_dues: [],
};

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

export function useDebts(filters?: {
  direction?: "all" | DebtDirection;
  status?: DebtStatus;
}) {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const direction = filters?.direction;
      const status = filters?.status;

      const getByDirection = async (value: DebtDirection) => {
        const params = new URLSearchParams({ direction: value });
        if (status) {
          params.set("status", status);
        }

        const response = await fetch(`/api/debts?${params.toString()}`);
        const payload = (await parseJsonSafely(response)) as DebtListResponse | null;

        if (!response.ok) {
          throw new Error(formatApiError(payload, "Failed to load debts"));
        }

        return payload?.debts ?? [];
      };

      let nextDebts: DebtItem[] = [];

      if (!direction || direction === "all") {
        const [iOwe, theyOwe] = await Promise.all([
          getByDirection("i_owe"),
          getByDirection("they_owe"),
        ]);

        nextDebts = [...iOwe, ...theyOwe].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        nextDebts = await getByDirection(direction);
      }

      setDebts(nextDebts);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load debts");
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.direction, filters?.status]);

  useEffect(() => {
    void fetchDebts();
  }, [fetchDebts]);

  const getDebt = useCallback(async (id: string) => {
    const response = await fetch(`/api/debts/${id}`);
    const payload = (await parseJsonSafely(response)) as DebtDetailResponse | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to load debt details"));
    }

    return payload?.debt ?? null;
  }, []);

  const createDebt = useCallback(
    async (input: {
      name: string;
      purpose?: string | null;
      totalAmount: number;
      counterparty: string;
      startDate: string;
      deadline?: string | null;
      status?: DebtStatus;
      paymentPeriod?: "weekly" | "monthly" | "custom";
      installmentAmount?: number | null;
      notes?: string | null;
      direction?: DebtDirection;
    }) => {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as DebtDetailResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to create debt"));
      }

      await fetchDebts();
      return payload?.debt ?? null;
    },
    [fetchDebts]
  );

  const updateDebt = useCallback(
    async (
      id: string,
      input: {
        name?: string;
        purpose?: string | null;
        totalAmount?: number;
        counterparty?: string;
        startDate?: string;
        deadline?: string | null;
        status?: DebtStatus;
        paymentPeriod?: "weekly" | "monthly" | "custom";
        installmentAmount?: number | null;
        notes?: string | null;
        direction?: DebtDirection;
      }
    ) => {
      const response = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as DebtDetailResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to update debt"));
      }

      await fetchDebts();
      return payload?.debt ?? null;
    },
    [fetchDebts]
  );

  const deleteDebt = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      const payload = (await parseJsonSafely(response)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to delete debt"));
      }

      await fetchDebts();
    },
    [fetchDebts]
  );

  const getDebtPayments = useCallback(async (debtId: string) => {
    const response = await fetch(`/api/debts/${debtId}/payments`);
    const payload = (await parseJsonSafely(response)) as PaymentListResponse | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to load debt payments"));
    }

    return payload?.payments ?? [];
  }, []);

  const createPayment = useCallback(
    async (
      debtId: string,
      input: { amount: number; paymentDate: string; status?: PaymentStatus; note?: string | null }
    ) => {
      const response = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as
        | { payment?: PaymentRecord; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to create payment"));
      }

      await fetchDebts();
      return payload?.payment ?? null;
    },
    [fetchDebts]
  );

  const updatePayment = useCallback(
    async (
      debtId: string,
      paymentId: string,
      input: { amount?: number; paymentDate?: string; status?: PaymentStatus; note?: string | null }
    ) => {
      const response = await fetch(`/api/debts/${debtId}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as
        | { payment?: PaymentRecord; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to update payment"));
      }

      await fetchDebts();
      return payload?.payment ?? null;
    },
    [fetchDebts]
  );

  const deletePayment = useCallback(
    async (debtId: string, paymentId: string) => {
      const response = await fetch(`/api/debts/${debtId}/payments/${paymentId}`, {
        method: "DELETE",
      });

      const payload = (await parseJsonSafely(response)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to delete payment"));
      }

      await fetchDebts();
    },
    [fetchDebts]
  );

  return {
    debts,
    loading,
    error,
    refetch: fetchDebts,
    getDebt,
    createDebt,
    updateDebt,
    deleteDebt,
    getDebtPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
}

export function useSummary() {
  const [summary, setSummary] = useState<DebtSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debts/summary");
      const payload = (await parseJsonSafely(response)) as (DebtSummary & { error?: unknown }) | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to load debt summary"));
      }

      setSummary({
        total_i_owe: payload?.total_i_owe ?? 0,
        total_they_owe: payload?.total_they_owe ?? 0,
        net_balance: payload?.net_balance ?? 0,
        upcoming_dues: payload?.upcoming_dues ?? [],
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load debt summary");
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
