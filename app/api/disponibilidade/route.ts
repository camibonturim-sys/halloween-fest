import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const agoraIso = new Date().toISOString();

    const { count, error } = await supabaseAdmin
      .from("ingressos")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("tipo", "open_gin_10")
      .or(
        `status.in.(pago,utilizado),and(status.eq.pendente,expira_em.gt.${agoraIso})`
      );

    if (error) {
      console.error(
        "Erro ao consultar disponibilidade do Open Gin:",
        error
      );

      return NextResponse.json(
        {
          erro: "Não foi possível consultar a disponibilidade.",
        },
        { status: 500 }
      );
    }

    const reservados = count ?? 0;
    const restantes = Math.max(0, 50 - reservados);

    return NextResponse.json(
      {
        reservados,
        restantes,
        total: 50,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    console.error(
      "Erro inesperado ao consultar disponibilidade:",
      erro
    );

    return NextResponse.json(
      {
        erro: "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}