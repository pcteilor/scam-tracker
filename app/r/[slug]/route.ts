import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveRedirect } from "@/lib/redirect";

const UID_COOKIE = "uid";
const UID_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getAnonymousId(request: NextRequest): string | undefined {
  return request.cookies.get(UID_COOKIE)?.value;
}

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const anonymousId = getAnonymousId(request) ?? crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;

  const result = await resolveRedirect(slug);

  await prisma.access.create({
    data: {
      campaignId: result.campaignId,
      requestedSlug: result.is404 ? slug : null,
      anonymousId,
      ip,
      userAgent,
      referer,
    },
  });

  const response = NextResponse.redirect(result.destination, 302);

  if (!getAnonymousId(request)) {
    response.cookies.set(UID_COOKIE, anonymousId, {
      path: "/",
      maxAge: UID_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}
