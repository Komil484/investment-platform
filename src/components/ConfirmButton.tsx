"use client";

import type { ButtonHTMLAttributes } from "react";

// A submit button that asks "are you sure?" first. Cancelling stops the form from being sent.
export function ConfirmButton({ message, ...props }: { message: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    />
  );
}
