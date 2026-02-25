import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { accesses: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Campanhas</h1>
        <Link
          href="/admin/campaigns/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nova campanha
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-700">Slug</th>
              <th className="px-4 py-2 font-medium text-gray-700">Status</th>
              <th className="px-4 py-2 font-medium text-gray-700">URL destino</th>
              <th className="px-4 py-2 font-medium text-gray-700">Acessos</th>
              <th className="px-4 py-2 font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma campanha. Crie a primeira.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 font-mono text-gray-900">{c.slug}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        c.status === "OPEN"
                          ? "rounded bg-green-100 px-2 py-0.5 text-green-800"
                          : "rounded bg-gray-200 px-2 py-0.5 text-gray-700"
                      }
                    >
                      {c.status === "OPEN" ? "Aberta" : "Fechada"}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-600" title={c.redirectUrl}>
                    {c.redirectUrl}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{c._count.accesses}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/reports/campaign/${c.id}`}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Relatório
                    </Link>
                    <Link
                      href={`/admin/campaigns/${c.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
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
