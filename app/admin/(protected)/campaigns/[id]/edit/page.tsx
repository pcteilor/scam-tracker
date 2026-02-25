import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CampaignForm from "../../CampaignForm";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  async function update(formData: FormData) {
    "use server";
    const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
    const redirectUrl = (formData.get("redirectUrl") as string)?.trim();
    const status = formData.get("status") === "OPEN" ? "OPEN" : "CLOSED";
    const metaTitle = (formData.get("metaTitle") as string)?.trim() || null;
    const metaDescription = (formData.get("metaDescription") as string)?.trim() || null;
    const ogImage = (formData.get("ogImage") as string)?.trim() || null;

    if (!slug || !redirectUrl) throw new Error("Slug e URL são obrigatórios");

    await prisma.campaign.update({
      where: { id },
      data: {
        slug,
        redirectUrl,
        status,
        metaTitle,
        metaDescription,
        ogImage,
      },
    });
    redirect("/admin/campaigns");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Editar campanha</h1>
      <CampaignForm
        action={update}
        initial={{
          slug: campaign.slug,
          redirectUrl: campaign.redirectUrl,
          status: campaign.status,
          metaTitle: campaign.metaTitle,
          metaDescription: campaign.metaDescription,
          ogImage: campaign.ogImage,
        }}
      />
    </div>
  );
}
