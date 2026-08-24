"use client";

import { useState, useCallback } from "react";

/**
 * Generic confirm-dialog state machine.
 *
 * Manages open/close, target entity, and loading state so that calling
 * components do not need to juggle four separate useState calls.
 *
 * Presentation details (title, message, variant) are passed directly to the
 * ConfirmDialog component — the hook manages STATE, not configuration.
 *
 * Entity-agnostic — works with any dialog target type via the T generic.
 */
export function useConfirmDialog<T = unknown>() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  /** Open the dialog with a target entity. */
  const openDialog = useCallback((target: T) => {
    setTarget(target);
    setOpen(true);
  }, []);

  /** Resolve the dialog (called by the confirm handler). */
  const confirm = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setLoading(false);
  }, []);

  /** Reject the dialog (called by the cancel handler). */
  const cancel = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setLoading(false);
  }, []);

  /** Close without committing (used for optimistic revert). */
  const close = useCallback(() => {
    setOpen(false);
    setTarget(null);
  }, []);

  return {
    open,
    target,
    loading,
    openDialog,
    confirm,
    cancel,
    close,
    setLoading,
  };
}
