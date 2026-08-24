import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type DadosAdmin = {
  pin?: string;
};

export async function POST(request: Request) {
  try {
    const dados = (await request.json()) as DadosAdmin;

    const pinRecebido = dados.pin?.trim();
    const pinCorreto = process.env.ADMIN_PIN;

    if (!pinCorreto) {
      return NextResponse.json(
        { erro: "PIN administrativo não configurado." },
        { status: 500 }
      );
    }

    if (!pinRecebido || pinRecebido !== pinCorreto) {
      return NextResponse.json(
        { erro: "PIN incorreto." },
        { status: 401 }
      );
    }

      const agoraIso = new Date().toISOString();
      const [
        total,
      pendentes,
      pagos,
      utilizados,
      cancelados,
      openGinAtivos,
      recentes,
    ] = await Promise.all([
      supabaseAdmin
        .from("ingressos")
        .select("*", {
          count: "exact",
          head: true,
        }),

     supabaseAdmin
  .from("ingressos")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("status", "pendente")
  .gt("expira_em", agoraIso),
  
      supabaseAdmin
        .from("ingressos")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "pago"),

      supabaseAdmin
        .from("ingressos")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "utilizado"),

      supabaseAdmin
        .from("ingressos")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "cancelado"),

   supabaseAdmin
  .from("ingressos")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("tipo", "open_gin_10")
  .or(
    `status.in.(pago,utilizado),and(status.eq.pendente,expira_em.gt.${agoraIso})`
  ),

      supabaseAdmin
  .from("ingressos")
  .select(
    "id, nome, email, tipo, valor, status, created_at, expira_em, pago_em, checkin_em"
  )
        .order("created_at", {
          ascending: false,
        })
        .limit(20),
    ]);

    const algumErro =
      total.error ||
      pendentes.error ||
      pagos.error ||
      utilizados.error ||
      cancelados.error ||
      openGinAtivos.error ||
      recentes.error;

    if (algumErro) {
      console.error(
        "Erro ao gerar resumo administrativo:",
        algumErro
      );

      return NextResponse.json(
        {
          erro:
            "Não foi possível carregar o painel administrativo.",
        },
        { status: 500 }
      );
    }

    const quantidadePagos = pagos.count ?? 0;
    const quantidadeUtilizados =
      utilizados.count ?? 0;

    const quantidadeOpenGin =
      openGinAtivos.count ?? 0;

    return NextResponse.json({
      sucesso: true,

      resumo: {
        totalPedidos: total.count ?? 0,
        pendentes: pendentes.count ?? 0,
        pagos: quantidadePagos,
        utilizados: quantidadeUtilizados,
        cancelados: cancelados.count ?? 0,

        vendidos:
          quantidadePagos +
          quantidadeUtilizados,

        openGinReservados:
          quantidadeOpenGin,

        openGinRestantes: Math.max(
          0,
          50 - quantidadeOpenGin
        ),
      },

      recentes: recentes.data ?? [],
    });
  } catch (erro) {
    console.error(
      "Erro inesperado no painel administrativo:",
      erro
    );

    return NextResponse.json(
      {
        erro:
          "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    funcionando: true,
    mensagem:
      "API do painel administrativo ativa.",
  });
}
