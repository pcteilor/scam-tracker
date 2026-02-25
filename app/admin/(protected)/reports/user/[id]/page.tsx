import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function UserReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const accesses = await prisma.access.findMany({
    where: { anonymousId: decodedId },
    orderBy: { createdAt: "desc" },
    include: { campaign: { select: { slug: true, id: true } } },
  });

  const total = accesses.length;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Perfil anônimo</h1>
      <p className="mb-1 font-mono text-sm text-gray-600 break-all">{decodedId}</p>
      <p className="mb-6 text-gray-600">Total de acessos: {total}</p>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-700">Data</th>
              <th className="px-4 py-2 font-medium text-gray-700">Campanha / Slug</th>
              <th className="px-4 py-2 font-medium text-gray-700">IP</th>
              <th className="px-4 py-2 font-medium text-gray-700">Referer</th>
            </tr>
          </thead>
          <tbody>
            {accesses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Nenhum acesso para este ID.
                </td>
              </tr>
            ) : (
              accesses.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 text-gray-600">
                    {a.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    {a.campaign ? (
                      <Link
                        href={`/admin/reports/campaign/${a.campaign.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {a.campaign.slug}
                      </Link>
                    ) : (
                      <span className="text-gray-500">{a.requestedSlug ?? "(404)"}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{a.ip ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-600" title={a.referer ?? ""}>
                    {a.referer ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
