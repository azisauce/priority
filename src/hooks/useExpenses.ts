"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseListResponse,
  ExpensePostResponse,
  UpdateExpenseInput,
} from "@/types/expense";

function formatApiError(errorPayload: unknown, fallback: string) {
  if (typeof errorPayload === "string") {
    return errorPayload;
  }

  if (
    typeof errorPayload === "object" &&
    errorPayload !== null &&
    "error" in errorPayload
  ) {
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

export function useExpenses(month: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses?month=${month}`);
      const payload = (await parseJsonSafely(response)) as ExpenseListResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to load expenses"));
      }

      setExpenses(payload?.expenses ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = useCallback(
    async (input: CreateExpenseInput) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as ExpensePostResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to create expense"));
      }

      await fetchExpenses();

      return {
        expense: payload?.data,
        warning: payload?.warning,
      };
    },
    [fetchExpenses]
  );

  const updateExpense = useCallback(
    async (id: string, input: UpdateExpenseInput) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as
        | { expense?: Expense; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to update expense"));
      }

      await fetchExpenses();
      return payload?.expense;
    },
    [fetchExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      const payload = (await parseJsonSafely(response)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to delete expense"));
      }

      await fetchExpenses();
    },
    [fetchExpenses]
  );

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
