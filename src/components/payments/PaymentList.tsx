"use client";

import { CalendarClock } from "lucide-react";
import EmptyState from "@/components/states/empty-state";
import PaymentCard from "@/components/payments/PaymentCard";
import type { MonthlyPayment } from "@/types/payment";

interface PaymentListProps {
  payments: MonthlyPayment[];
  onPaymentClick?: (payment: MonthlyPayment) => void;
  onMarkAsPaid?: (payment: MonthlyPayment) => void;
  markingPaymentId?: string | null;
}

export default function PaymentList({
  payments,
  onPaymentClick,
  onMarkAsPaid,
  markingPaymentId,
}: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No recurring payments"
        description="Add a monthly payment to track scheduled income and expenses."
      />
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          onClick={onPaymentClick ? () => onPaymentClick(payment) : undefined}
          onMarkAsPaid={
            onMarkAsPaid && payment.isActive ? () => onMarkAsPaid(payment) : undefined
          }
          markAsPaidLoading={markingPaymentId === payment.id}
        />
      ))}
    </div>
  );
}
