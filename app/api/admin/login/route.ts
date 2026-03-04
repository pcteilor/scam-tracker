import { NextRequest, NextResponse } from "next/server";
import { validateAdminPassword, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password;
    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { error: "Senha obrigatória" },
        { status: 400 }
      );
    }

    const valid = await validateAdminPassword(password);
    if (!valid) {
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401 }
      );
    }

    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const ex = err instanceof Error ? err : new Error(String(err));
    const isDbUnreachable =
      ex.name === "PrismaClientInitializationError" ||
      (typeof ex.message === "string" && ex.message.includes("Can't reach database server"));
    return NextResponse.json(
      {
        error: isDbUnreachable
          ? "Banco de dados inacessível. Verifique a conexão (Neon, rede, firewall) e se as migrations e o seed foram executados."
          : "Erro no servidor",
      },
      { status: isDbUnreachable ? 503 : 500 }
    );
  }
}
