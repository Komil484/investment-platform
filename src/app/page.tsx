import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Investment Matching Platform</h1>
      <Link href="/register" className="btn-primary">
        Create an account
      </Link>
    </main>
  );
}
