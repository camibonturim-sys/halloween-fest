import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const autorizacao =
    request.headers.get("authorization");

  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    autorizacao !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      { erro: "Não autorizado." },
      { status: 401 }
    );
  }

  const { error } = await supabaseAdmin
    .from("ingressos")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    console.error(
      "Erro no keepalive do Supabase:",
      error
    );

    return NextResponse.json(
      { erro: "Erro ao consultar o banco." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    funcionando: true,
    mensagem: "Supabase consultado com sucesso.",
  });
}