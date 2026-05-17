"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(data: PasswordInput) {
    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
      });
      if (error) throw new Error(error.message);
      toast.success("Password changed");
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Current Password
        </label>
        <Input
          id="currentPassword"
          type="password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New Password
        </label>
        <Input id="newPassword" type="password" {...register("newPassword")} />
        {errors.newPassword && (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm New Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Changing..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
