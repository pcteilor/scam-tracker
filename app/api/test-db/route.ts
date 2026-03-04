import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      method: "neon-http",
      message: "Conexão com o banco OK (Neon HTTP).",
    });
  } catch (err) {
    const ex = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json(
      {
        ok: false,
        error: ex.message,
        name: ex.name,
      },
      { status: 503 }
    );
  }
}
