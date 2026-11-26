"use client";

import type { FormEvent, ReactNode } from "react";

/** GET form so filters work even if App Router client navigation does not. */
export function FilterForm({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) {
  return (
    <form
      className="controls"
      action={action}
      method="get"
      onChange={(event: FormEvent<HTMLFormElement>) => {
        if (event.target instanceof HTMLSelectElement) {
          event.currentTarget.requestSubmit();
        }
      }}
    >
      {children}
      <button type="submit">Apply</button>
    </form>
  );
}
