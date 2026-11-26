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
        if (!(event.target instanceof HTMLSelectElement)) {
          return;
        }
        const form = event.currentTarget;
        if (event.target.name === "island") {
          const region = form.elements.namedItem("region");
          if (region instanceof HTMLSelectElement) {
            region.value = "";
          }
        }
        form.requestSubmit();
      }}
    >
      {children}
      <button type="submit">Apply</button>
    </form>
  );
}
