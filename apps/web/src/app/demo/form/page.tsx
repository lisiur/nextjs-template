"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  country: z.string().min(1, "Please select a country"),
  preference: z.enum(["email", "sms", "push"], {
    error: "Please select a preference",
  }),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
  birthDate: z.date({ error: "Please select a birth date" }),
  appointmentTime: z.string().optional(),
  billingMonth: z.string().min(1, "Please select a billing month"),
  dateRangeStart: z.date({ error: "Please select a start date" }),
  dateRangeEnd: z.date({ error: "Please select an end date" }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
  avatar: z.any().optional(),
});

type FormInput = z.infer<typeof formSchema>;

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "cn", label: "China" },
];

const interests = [
  { id: "tech", label: "Technology" },
  { id: "design", label: "Design" },
  { id: "music", label: "Music" },
  { id: "travel", label: "Travel" },
  { id: "sports", label: "Sports" },
];

export default function FormDemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      bio: "",
      country: "",
      preference: "email",
      interests: [],
      birthDate: new Date(),
      appointmentTime: "",
      billingMonth: "",
      dateRangeStart: new Date(),
      dateRangeEnd: new Date(),
      terms: false,
    },
  });

  const termsValue = watch("terms");
  const interestsValue = watch("interests");
  const dateRangeStart = watch("dateRangeStart");
  const dateRangeEnd = watch("dateRangeEnd");
  const formValues = watch();

  async function onSubmit(data: FormInput) {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Form submitted:", data);
      toast.success("Form submitted successfully!", {
        description: "Your data has been processed.",
      });
      reset();
    } catch {
      toast.error("Submission failed", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    reset();
  }

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <h1 className="mb-2 text-xl font-semibold">Form Demo</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        A comprehensive form showcasing all common field types with validation
      </p>

      <div className="flex w-full max-w-5xl gap-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">
                    {errors.bio.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("country")}
                  onValueChange={(value) =>
                    setValue("country", value as string, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-destructive">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>
                  Notification Preference{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  defaultValue="email"
                  onValueChange={(value) =>
                    setValue("preference", value as "email" | "sms" | "push")
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email-pref" />
                    <Label htmlFor="email-pref" className="font-normal">
                      Email notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms-pref" />
                    <Label htmlFor="sms-pref" className="font-normal">
                      SMS notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="push" id="push-pref" />
                    <Label htmlFor="push-pref" className="font-normal">
                      Push notifications
                    </Label>
                  </div>
                </RadioGroup>
                {errors.preference && (
                  <p className="text-sm text-destructive">
                    {errors.preference.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>
                  Interests <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-4">
                  {interests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={interest.id}
                        checked={interestsValue.includes(interest.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...interestsValue, interest.id]
                            : interestsValue.filter((v) => v !== interest.id);
                          setValue("interests", next, { shouldValidate: true });
                        }}
                      />
                      <Label htmlFor={interest.id} className="font-normal">
                        {interest.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.interests && (
                  <p className="text-sm text-destructive">
                    {errors.interests.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>
                  Birth Date <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={watch("birthDate")}
                  onChange={(date) =>
                    setValue("birthDate", date ?? new Date(), {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.birthDate && (
                  <p className="text-sm text-destructive">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="appointmentTime">Appointment Time</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  {...register("appointmentTime")}
                />
                {errors.appointmentTime && (
                  <p className="text-sm text-destructive">
                    {errors.appointmentTime.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="billingMonth">
                  Billing Month <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="billingMonth"
                  type="month"
                  {...register("billingMonth")}
                />
                {errors.billingMonth && (
                  <p className="text-sm text-destructive">
                    {errors.billingMonth.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>
                  Date Range <span className="text-destructive">*</span>
                </Label>
                <DateRangePicker
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onChange={(range) => {
                    setValue("dateRangeStart", range?.from ?? new Date(), {
                      shouldValidate: true,
                    });
                    setValue("dateRangeEnd", range?.to ?? new Date(), {
                      shouldValidate: true,
                    });
                  }}
                />
                {(errors.dateRangeStart || errors.dateRangeEnd) && (
                  <p className="text-sm text-destructive">
                    {errors.dateRangeStart?.message ||
                      errors.dateRangeEnd?.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="avatar">Avatar (Optional)</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  {...register("avatar")}
                />
                <p className="text-sm text-muted-foreground">
                  Upload an image file (JPEG, PNG, GIF)
                </p>
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsValue}
                    onCheckedChange={(checked) =>
                      setValue("terms", checked === true, {
                        shouldValidate: true,
                      })
                    }
                  />
                  <Label htmlFor="terms" className="font-normal">
                    I agree to the terms and conditions{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">
                    {errors.terms.message}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="sticky top-8 w-full max-w-lg self-start">
          <CardHeader>
            <CardTitle>Form Values (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[600] overflow-auto rounded-md bg-muted p-4 text-xs">
              {mounted
                ? JSON.stringify(
                    formValues,
                    (_key, value) =>
                      value instanceof Date ? value.toISOString() : value,
                    2,
                  )
                : "Loading..."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
