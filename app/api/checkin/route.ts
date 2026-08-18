import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type DadosCheckin = {
  qrCode?: string;
  pin?: string;
};

function extrairCodigo(valor: string) {
  const prefixo = "HALLOWEEN-FEST:";

  if (valor.startsWith(prefixo)) {
    return valor.slice(prefixo.length);
  }

  return valor;
}

export async function POST(request: Request) {
  try {
    const dados = (await request.json()) as DadosCheckin;

    const qrRecebido = dados.qrCode?.trim();
    const pinRecebido = dados.pin?.trim();

    const pinCorreto = process.env.CHECKIN_ADMIN_PIN;

    if (!pinCorreto) {
      return NextResponse.json(
        { erro: "PIN de check-in não configurado." },
        { status: 500 }
      );
    }

    if (!pinRecebido || pinRecebido !== pinCorreto) {
      return NextResponse.json(
        { erro: "PIN incorreto." },
        { status: 401 }
      );
    }

    if (!qrRecebido) {
      return NextResponse.json(
        { erro: "QR Code não informado." },
        { status: 400 }
      );
    }

    const codigo = extrairCodigo(qrRecebido);

    const uuidValido =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidValido.test(codigo)) {
      return NextResponse.json(
        { erro: "QR Code inválido." },
        { status: 400 }
      );
    }

    /*
     * Só permite check-in se o ingresso ainda estiver pago.
     * A primeira leitura muda para utilizado.
     * Uma segunda leitura não consegue passar por este filtro.
     */
    const agora = new Date().toISOString();

    const {
      data: ingressoUtilizado,
      error: erroAtualizacao,
    } = await supabaseAdmin
      .from("ingressos")
      .update({
        status: "utilizado",
        checkin_em: agora,
      })
      .eq("qr_code", codigo)
      .eq("status", "pago")
      .select("id, tipo, valor, status, checkin_em")
      .maybeSingle();

    if (erroAtualizacao) {
      console.error(
        "Erro ao realizar check-in:",
        erroAtualizacao
      );

      return NextResponse.json(
        { erro: "Não foi possível realizar o check-in." },
        { status: 500 }
      );
    }

    if (ingressoUtilizado) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Entrada liberada.",
        ingresso: ingressoUtilizado,
      });
    }

    /*
     * Se não atualizou, verificamos o motivo:
     * ingresso inexistente, pendente ou já utilizado.
     */
    const {
      data: ingresso,
      error: erroBusca,
    } = await supabaseAdmin
      .from("ingressos")
      .select("id, tipo, valor, status, checkin_em")
      .eq("qr_code", codigo)
      .maybeSingle();

    if (erroBusca) {
      console.error(
        "Erro ao consultar ingresso:",
        erroBusca
      );

      return NextResponse.json(
        { erro: "Não foi possível consultar o ingresso." },
        { status: 500 }
      );
    }

    if (!ingresso) {
      return NextResponse.json(
        { erro: "Ingresso não encontrado." },
        { status: 404 }
      );
    }

    if (ingresso.status === "utilizado") {
      return NextResponse.json(
        {
          erro: "Este ingresso já foi utilizado.",
          status: ingresso.status,
          checkinEm: ingresso.checkin_em,
        },
        { status: 409 }
      );
    }

    if (ingresso.status === "pendente") {
      return NextResponse.json(
        { erro: "Pagamento ainda não confirmado." },
        { status: 409 }
      );
    }

    if (ingresso.status === "cancelado") {
      return NextResponse.json(
        { erro: "Ingresso cancelado." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { erro: "Ingresso indisponível para check-in." },
      { status: 409 }
    );
  } catch (erro) {
    console.error("Erro inesperado no check-in:", erro);

    return NextResponse.json(
      { erro: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    funcionando: true,
    mensagem: "API de check-in ativa.",
  });
}
