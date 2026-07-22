"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";

import { cn } from "#lib/utils";
import { Input } from "./input";

function InputPassword({ className, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  );
}

export { InputPassword };
