import type { AlertColor } from "@mui/material/Alert";
import type { ReactNode } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export type Severity = AlertColor;

export interface SnackbarMessage {
  message: ReactNode;
  severity: Severity;
  key: string | number;
}

export interface SnackbarProviderState {
  message?: SnackbarMessage;
  snackbarOpen: boolean;
  openSnackbar: (
    newMessage: ReactNode,
    severity?: Severity,
    key?: string | number,
  ) => void;
  closeSnackbar: () => void;
  toastInfo: (message: ReactNode, key?: string | number) => void;
  toastSuccess: (message: ReactNode, key?: string | number) => void;
  toastWarning: (message: ReactNode, key?: string | number) => void;
  toastError: (message: ReactNode, key?: string | number) => void;
}

const formatMessage = (
  newMessage: ReactNode,
  severity: Severity = "info",
  key: string | number = Date.now(),
) => {
  const message: SnackbarMessage = {
    message: newMessage,
    severity,
    key,
  };
  return message;
};

const useStore = create<SnackbarProviderState>((set, get) => ({
  message: undefined,
  snackbarOpen: false,
  openSnackbar: (newMessage, severity = "info", key = Date.now()) => {
    set({
      snackbarOpen: true,
      message: formatMessage(newMessage, severity, key),
    });
  },
  closeSnackbar: () => {
    set({
      snackbarOpen: false,
      message: undefined,
    });
  },
  toastInfo: (message, key) => get().openSnackbar(message, "info", key),
  toastSuccess: (message, key) => get().openSnackbar(message, "success", key),
  toastError: (message, key) => get().openSnackbar(message, "error", key),
  toastWarning: (message, key) => get().openSnackbar(message, "warning", key),
}));

const getSnackActions = (store: SnackbarProviderState) => ({
  toastError: store.toastError,
  toastInfo: store.toastInfo,
  toastWarning: store.toastWarning,
  toastSuccess: store.toastSuccess,
  closeSnackbar: store.closeSnackbar,
});

const useSnackbarActions = () => {
  return useStore(useShallow(getSnackActions));
};

export { useStore as useSnackbarStore, useSnackbarActions };
