import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type ContextoRota = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  contexto: ContextoRota
) {
  try {
    const { id } = await contexto.params;

    const uuidValido =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidValido.test(id)) {
      return NextResponse.json(
        { erro: "Identificador inválido." },
        { status: 400 }
      );
    }

    const { data: ingresso, error } =
      await supabaseAdmin
        .from("ingressos")
        .select(
          "id, tipo, valor, status, qr_code, pago_em"
        )
        .eq("id", id)
        .maybeSingle();

    if (error) {
      console.error(
        "Erro ao consultar ingresso:",
        error
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

if (
  ingresso.status !== "pago" ||
  !ingresso.qr_code
) {
      return NextResponse.json({
        ingressoId: ingresso.id,
        status: ingresso.status,
        tipo: ingresso.tipo,
        valor: Number(ingresso.valor),
        pagoEm: ingresso.pago_em,
        qrCodeImagem: null,
      });
    }

    const conteudoQrCode =
      `HALLOWEEN-FEST:${ingresso.qr_code}`;

    const qrCodeImagem =
      await QRCode.toDataURL(conteudoQrCode, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: "H",
      });

    return NextResponse.json({
      ingressoId: ingresso.id,
      status: ingresso.status,
      tipo: ingresso.tipo,
      valor: Number(ingresso.valor),
      pagoEm: ingresso.pago_em,
      qrCodeImagem,
    });
  } catch (erro) {
    console.error(
      "Erro inesperado ao consultar ingresso:",
      erro
    );

    return NextResponse.json(
      { erro: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
