import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const is404Report = id === "404";

  const campaign = is404Report
    ? null
    : await prisma.campaign.findUnique({
        where: { id },
        include: { _count: { select: { accesses: true } } },
      });

  if (!is404Report && !campaign) notFound();

  const count404 = await prisma.access.count({ where: { campaignId: null } });
  const accesses = await prisma.access.findMany({
    where: is404Report ? { campaignId: null } : { campaignId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const title = is404Report ? "Acessos 404 (slug não encontrado)" : `Relatório: ${campaign!.slug}`;
  const total = is404Report ? count404 : campaign!._count.accesses;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
        {!is404Report && (
          <Link href="/admin/campaigns" className="text-gray-600 hover:text-gray-900">
            Campanhas
          </Link>
        )}
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mb-6 text-gray-600">
        Total de acessos: {total}
      </p>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-700">Data</th>
              {is404Report && (
                <th className="px-4 py-2 font-medium text-gray-700">Slug tentado</th>
              )}
              <th className="px-4 py-2 font-medium text-gray-700">IP</th>
              <th className="px-4 py-2 font-medium text-gray-700">User-Agent</th>
              <th className="px-4 py-2 font-medium text-gray-700">ID anônimo</th>
            </tr>
          </thead>
          <tbody>
            {accesses.length === 0 ? (
              <tr>
                <td colSpan={is404Report ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                  Nenhum acesso.
                </td>
              </tr>
            ) : (
              accesses.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 text-gray-600">
                    {a.createdAt.toLocaleString("pt-BR")}
                  </td>
                  {is404Report && (
                    <td className="px-4 py-2 font-mono text-gray-600">{a.requestedSlug ?? "—"}</td>
                  )}
                  <td className="px-4 py-2 text-gray-600">{a.ip ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-600" title={a.userAgent ?? ""}>
                    {a.userAgent ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/reports/user/${encodeURIComponent(a.anonymousId)}`}
                      className="text-blue-600 hover:underline"
                    >
                      {a.anonymousId}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 200 && (
        <p className="mt-2 text-sm text-gray-500">
          Exibindo os 200 acessos mais recentes.
        </p>
      )}
    </div>
  );
}
