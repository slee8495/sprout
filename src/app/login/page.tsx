import { PARENT_NAMES } from "@/auth";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-400">🌱 Sprout</h1>
      <LoginForm parentNames={PARENT_NAMES} />
    </main>
  );
}
