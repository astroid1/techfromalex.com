import { cn } from "@/lib/utils";
import { SignupForm } from "./SignupForm";

export function InlineCTA({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "my-10 rounded-lg border border-border bg-card p-6 sm:p-8",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-foreground">
        Enjoyed this post?
      </h3>
      <p className="mt-1 text-sm text-muted">
        Get the latest reviews, guides, and deals delivered straight to your
        inbox. No spam, unsubscribe anytime.
      </p>
      <SignupForm className="mt-4" />
    </section>
  );
}
