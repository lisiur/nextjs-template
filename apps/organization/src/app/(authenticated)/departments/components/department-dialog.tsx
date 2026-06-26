"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@repo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { appClient, withApiFeedback } from "@/lib/api";

const departmentFormSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentFormSchema>;

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  parentId?: string;
  department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
}

export function DepartmentDialog({
  open,
  onOpenChange,
  orgId,
  parentId,
  department,
}: DepartmentDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!department;

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      if (isEdit) {
        await withApiFeedback(
          appClient.api.organizations[":orgId"].departments[":id"].$put,
        )({
          param: { orgId, id: department.id },
          json: data,
        });
      } else {
        await withApiFeedback(
          appClient.api.organizations[":orgId"].departments.$post,
        )({
          param: { orgId },
          json: { ...data, parentId: parentId ?? null },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success(isEdit ? "Department updated" : "Department created");
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Department" : "Create Department"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="dept-name">Name</FieldLabel>
              <Input
                id="dept-name"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
                placeholder="Engineering"
              />
              <FieldError
                errors={
                  form.formState.errors.name
                    ? [form.formState.errors.name]
                    : undefined
                }
              />
            </Field>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="dept-code">Code</FieldLabel>
              <Input
                id="dept-code"
                aria-invalid={!!form.formState.errors.code}
                {...form.register("code")}
                placeholder="engineering"
              />
              <FieldError
                errors={
                  form.formState.errors.code
                    ? [form.formState.errors.code]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dept-description">Description</FieldLabel>
              <Textarea
                id="dept-description"
                {...form.register("description")}
                placeholder="Optional description"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
