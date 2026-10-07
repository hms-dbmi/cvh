import { create } from "zustand";

// Tracks whether the open Vitessce visualization has annotation changes that
// would be lost by leaving it: switching visualizations, switching to the
// code editor, navigating away, or closing the tab. Only annotation stories
// count. Vitessce marks the config changed on every pan or zoom, so warning
// on any unsaved change would nag constantly.
interface PendingLeave {
  proceed: () => void;
  cancel: () => void;
}

export interface UnsavedAnnotationsState {
  hasUnsavedAnnotations: boolean;
  // Registered by the viewer that owns the unsaved changes. `save` resolves
  // to whether it succeeded.
  save?: () => Promise<boolean>;
  discard?: () => void;
  // Set while the "unsaved annotations" dialog is waiting on the user.
  pendingLeave: PendingLeave | null;
  setHasUnsavedAnnotations: (value: boolean) => void;
  register: (handlers: {
    save: () => Promise<boolean>;
    discard: () => void;
  }) => void;
  reset: () => void;
  // Runs `proceed` now if nothing is unsaved; otherwise asks first.
  confirmLeave: (proceed: () => void, cancel?: () => void) => void;
  clearPendingLeave: () => void;
}

const useStore = create<UnsavedAnnotationsState>((set, get) => ({
  hasUnsavedAnnotations: false,
  pendingLeave: null,
  setHasUnsavedAnnotations: (value) => set({ hasUnsavedAnnotations: value }),
  register: ({ save, discard }) => set({ save, discard }),
  reset: () =>
    set({
      hasUnsavedAnnotations: false,
      save: undefined,
      discard: undefined,
      pendingLeave: null,
    }),
  confirmLeave: (proceed, cancel = () => {}) => {
    if (!get().hasUnsavedAnnotations) {
      proceed();
      return;
    }
    set({ pendingLeave: { proceed, cancel } });
  },
  clearPendingLeave: () => set({ pendingLeave: null }),
}));

export { useStore as useUnsavedAnnotationsStore };
