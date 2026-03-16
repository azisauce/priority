"use client";

import { useSyncExternalStore } from "react";

export type ModalType =
  | "ADD_BUDGET"
  | "ADD_EXPENSE"
  | "ADD_PAYMENT"
  | "MARK_AS_PAID";

type ModalStoreState = {
  activeModal: ModalType | null;
};

let state: ModalStoreState = {
  activeModal: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function openModal(modalType: ModalType) {
  state = {
    activeModal: modalType,
  };
  emitChange();
}

export function closeModal() {
  state = {
    activeModal: null,
  };
  emitChange();
}

export function useModalStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    activeModal: snapshot.activeModal,
    openModal,
    closeModal,
  };
}
