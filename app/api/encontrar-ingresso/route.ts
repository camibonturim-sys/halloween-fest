import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type DadosBusca = {
  email?: string;
  telefone?: string;
};

function limparTelefone(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const dados = (await request.json()) as DadosBusca;

    const email = dados.email?.trim().toLowerCase();
    const telefone = limparTelefone(
      dados.telefone?.trim() ?? ""
    );

    if (!email || !telefone) {
      return NextResponse.json(
        {
          erro: "Informe o e-mail e o telefone usados na compra.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { erro: "Digite um e-mail válido." },
        { status: 400 }
      );
    }

    if (telefone.length < 10) {
      return NextResponse.json(
        { erro: "Digite um telefone válido." },
        { status: 400 }
      );
    }

    /*
     * Procuramos primeiro pelo e-mail.
     * O telefone é conferido no servidor para funcionar
     * mesmo se foi salvo com espaços, parênteses ou hífen.
     */
    const { data, error } = await supabaseAdmin
      .from("ingressos")
      .select(
        "id, telefone, tipo, valor, status, created_at"
      )
      .eq("email", email)
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (error) {
      console.error(
        "Erro ao procurar ingresso:",
        error
      );

      return NextResponse.json(
        {
          erro: "Não foi possível procurar seus ingressos.",
        },
        { status: 500 }
      );
    }

    const encontrados = (data ?? [])
      .filter(
        (ingresso) =>
          limparTelefone(ingresso.telefone ?? "") ===
          telefone
      )
      .map((ingresso) => ({
        id: ingresso.id,
        tipo: ingresso.tipo,
        valor: Number(ingresso.valor),
        status: ingresso.status,
        criadoEm: ingresso.created_at,
       ingressoDisponivel:
  ingresso.status === "pago",
      }));

    /*
     * Não devolvemos nome, e-mail, telefone,
     * QR interno ou dados do Mercado Pago.
     */
    return NextResponse.json({
      sucesso: true,
      encontrados,
    });
  } catch (erro) {
    console.error(
      "Erro inesperado ao encontrar ingresso:",
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

export async function GET() {
  return NextResponse.json({
    funcionando: true,
    mensagem: "API para encontrar ingresso ativa.",
  });
}