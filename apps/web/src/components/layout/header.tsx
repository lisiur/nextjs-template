import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background px-6">
      <span className="text-lg font-semibold">Next101</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
