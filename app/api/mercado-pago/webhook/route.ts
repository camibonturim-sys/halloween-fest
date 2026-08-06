import { randomUUID } from "crypto";
import { WebhookSignatureValidator } from "mercadopago";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type CorpoWebhook = {
  type?: string;
  data?: {
    id?: string;
  };
};

type OrdemMercadoPago = {
  id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
    }>;
  };
};

function converterStatus(
  status?: string,
  statusDetail?: string
): "pendente" | "pago" | "cancelado" {
  if (
    status === "processed" &&
    statusDetail !== "partially_refunded"
  ) {
    return "pago";
  }

  const statusCancelados = [
    "canceled",
    "expired",
    "failed",
    "refunded",
    "charged_back",
  ];

  if (
    statusCancelados.includes(status ?? "") ||
    statusDetail === "partially_refunded"
  ) {
    return "cancelado";
  }

  return "pendente";
}

export async function POST(request: Request) {
  try {
    const accessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const webhookSecret =
      process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    if (!accessToken || !webhookSecret) {
      console.error(
        "Credenciais do webhook não configuradas."
      );

      return NextResponse.json(
        { erro: "Configuração incompleta do servidor." },
        { status: 500 }
      );
    }

    const url = new URL(request.url);

    const corpo = (await request
      .json()
      .catch(() => null)) as CorpoWebhook | null;

    const dataId =
      url.searchParams.get("data.id") ??
      corpo?.data?.id;

    const tipo =
      url.searchParams.get("type") ??
      corpo?.type;

    /*
     * Ignora outros tipos de notificações.
     */
    if (tipo && tipo !== "order") {
      return NextResponse.json({
        recebido: true,
        ignorado: true,
      });
    }

    const xSignature =
      request.headers.get("x-signature");

    const xRequestId =
      request.headers.get("x-request-id");

    if (!dataId || !xSignature || !xRequestId) {
      return NextResponse.json(
        { erro: "Notificação incompleta." },
        { status: 400 }
      );
    }

    /*
     * Confirma que a notificação foi realmente
     * enviada pelo Mercado Pago.
     */
    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId,
        dataId,
        secret: webhookSecret,
      });
    } catch (erroAssinatura) {
      console.error(
        "Assinatura inválida do webhook:",
        erroAssinatura
      );

      return NextResponse.json(
        { erro: "Assinatura inválida." },
        { status: 401 }
      );
    }

    /*
     * Consulta os dados verdadeiros da order
     * diretamente no Mercado Pago.
     */
    const respostaOrdem = await fetch(
      `https://api.mercadopago.com/v1/orders/${encodeURIComponent(
        dataId
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!respostaOrdem.ok) {
      const detalhes = await respostaOrdem.text();

      console.error(
        "Erro ao consultar order:",
        respostaOrdem.status,
        detalhes
      );

      return NextResponse.json(
        { erro: "Não foi possível consultar a order." },
        { status: 502 }
      );
    }

    const ordem =
      (await respostaOrdem.json()) as OrdemMercadoPago;

    const referencia = ordem.external_reference;

    if (!referencia) {
      console.error(
        "Order sem external_reference:",
        ordem
      );

      return NextResponse.json(
        { erro: "Order sem referência do pedido." },
        { status: 400 }
      );
    }

    const pagamento =
      ordem.transactions?.payments?.[0];

    const statusBanco = converterStatus(
      ordem.status,
      ordem.status_detail
    );

    /*
     * Busca o pedido para preservar a data do
     * primeiro recebimento do pagamento.
     */
    const {
      data: ingresso,
      error: erroBusca,
    } = await supabaseAdmin
      .from("ingressos")
      .select("id, pago_em, qr_code")
      .eq("id", referencia)
      .maybeSingle();

    if (erroBusca) {
      console.error(
        "Erro ao procurar ingresso:",
        erroBusca
      );

      return NextResponse.json(
        { erro: "Erro ao procurar o pedido." },
        { status: 500 }
      );
    }

    /*
     * Uma order que não pertence ao site é ignorada,
     * evitando novas tentativas desnecessárias.
     */
    if (!ingresso) {
      console.warn(
        "Pedido não encontrado no Supabase:",
        referencia
      );

      return NextResponse.json({
        recebido: true,
        ignorado: true,
      });
    }

    const atualizacao: Record<
      string,
      string | null
    > = {
      status: statusBanco,
      mercado_pago_id:
        ordem.id ?? dataId,
      pagamento_id:
        pagamento?.id ?? null,
    };

  if (statusBanco === "pago") {
  atualizacao.pago_em =
    ingresso.pago_em ??
    new Date().toISOString();

  atualizacao.qr_code =
    ingresso.qr_code ??
    randomUUID();
}

    const { error: erroAtualizacao } =
      await supabaseAdmin
        .from("ingressos")
        .update(atualizacao)
        .eq("id", referencia);

    if (erroAtualizacao) {
      console.error(
        "Erro ao atualizar ingresso:",
        erroAtualizacao
      );

      return NextResponse.json(
        { erro: "Erro ao atualizar o pedido." },
        { status: 500 }
      );
    }

    console.log(
      `Pedido ${referencia} atualizado para ${statusBanco}.`
    );

    return NextResponse.json({
      recebido: true,
      pedidoId: referencia,
      status: statusBanco,
    });
  } catch (erro) {
    console.error(
      "Erro inesperado no webhook:",
      erro
    );

    return NextResponse.json(
      { erro: "Erro interno no webhook." },
      { status: 500 }
    );
  }
}

/*
 * Permite verificar no navegador se a rota existe.
 */
export async function GET() {
  return NextResponse.json({
    funcionando: true,
    mensagem: "Webhook do Mercado Pago ativo.",
  });
}
