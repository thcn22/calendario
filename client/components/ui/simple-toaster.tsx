import React from "react";

export function SimpleToaster() {
  return null; // Por enquanto não fazer nada
}

export function useToast() {
  return {
    toast: (props: any) => {
      console.log("Toast:", props);
    },
    dismiss: () => {},
    toasts: [],
  };
}
