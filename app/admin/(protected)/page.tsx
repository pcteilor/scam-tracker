import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [totalAccesses, todayAccesses, weekAccesses, recentAccesses, topCampaigns, count404] =
    await Promise.all([
      prisma.access.count(),
      prisma.access.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.access.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.access.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, slug: true } } },
      }),
      prisma.access.groupBy({
        by: ["campaignId"],
        where: { campaignId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.access.count({ where: { campaignId: null } }),
    ]);

  const campaignIds = topCampaigns.map((c) => c.campaignId).filter(Boolean) as string[];
  const campaigns = campaignIds.length
    ? await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, slug: true },
      })
    : [];
  const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c.slug]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total de acessos</p>
          <p className="text-2xl font-semibold text-gray-900">{totalAccesses}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Hoje</p>
          <p className="text-2xl font-semibold text-gray-900">{todayAccesses}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Últimos 7 dias</p>
          <p className="text-2xl font-semibold text-gray-900">{weekAccesses}</p>
        </div>
        <Link href="/admin/reports/campaign/404" className="rounded-lg border bg-white p-4 block hover:border-gray-300">
          <p className="text-sm text-gray-600">Acessos 404</p>
          <p className="text-2xl font-semibold text-gray-900">{count404}</p>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-gray-900">Top campanhas (cliques)</h2>
        <ul className="rounded-lg border bg-white">
          {topCampaigns.length === 0 ? (
            <li className="px-4 py-3 text-gray-500">Nenhum acesso ainda.</li>
          ) : (
            topCampaigns.map((c) => (
              <li
                key={c.campaignId ?? "null"}
                className="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
              >
                <span className="text-gray-700">
                  {c.campaignId ? campaignMap[c.campaignId] ?? c.campaignId : "(404)"}
                </span>
                <span className="font-medium text-gray-900">{c._count.id}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-gray-900">Acessos recentes</h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 font-medium text-gray-700">Data</th>
                <th className="px-4 py-2 font-medium text-gray-700">Campanha / Slug</th>
                <th className="px-4 py-2 font-medium text-gray-700">IP</th>
                <th className="px-4 py-2 font-medium text-gray-700">ID anônimo</th>
              </tr>
            </thead>
            <tbody>
              {recentAccesses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Nenhum acesso registrado.
                  </td>
                </tr>
              ) : (
                recentAccesses.map((a) => (
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
                        <span className="text-gray-500">
                          {a.requestedSlug ?? "(404)"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{a.ip ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/reports/user/${encodeURIComponent(a.anonymousId)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {a.anonymousId.slice(0, 8)}…
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
