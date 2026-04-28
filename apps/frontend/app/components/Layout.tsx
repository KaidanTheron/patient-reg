import { Link } from "react-router";

export function AppShell({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}

export function TextLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: "border-slate-900 bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    danger: "border-red-700 bg-red-700 text-white hover:bg-red-600",
  };

  return (
    <button
      {...props}
      className={[
        "rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500";

export function Notice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral: "border-slate-200 bg-white text-slate-700",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-lg border p-4 text-sm ${styles[tone]}`}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
