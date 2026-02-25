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
  } catch {
    return NextResponse.json(
      { error: "Erro no servidor" },
      { status: 500 }
    );
  }
}
