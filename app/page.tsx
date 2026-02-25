import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <h1 className="text-xl font-semibold text-gray-900">Scam Tracker</h1>
      <p className="text-gray-600">
        Redirecionamento e rastreamento por campanha.
      </p>
      <Link
        href="/admin"
        className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        Acessar painel
      </Link>
    </div>
  );
}
