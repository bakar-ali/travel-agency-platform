import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-stone-500">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
