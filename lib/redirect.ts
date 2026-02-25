import { prisma } from "./db";

const FALLBACK_URL = "https://www.google.com";

export type RedirectResult = {
  destination: string;
  campaignId: string | null;
  requestedSlug: string;
  is404: boolean;
}

export async function resolveRedirect(slug: string): Promise<RedirectResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
  });

  if (!campaign) {
    return {
      destination: FALLBACK_URL,
      campaignId: null,
      requestedSlug: slug,
      is404: true,
    };
  }

  if (campaign.status === "CLOSED") {
    return {
      destination: FALLBACK_URL,
      campaignId: campaign.id,
      requestedSlug: slug,
      is404: false,
    };
  }

  return {
    destination: campaign.redirectUrl,
    campaignId: campaign.id,
    requestedSlug: slug,
    is404: false,
  };
}
