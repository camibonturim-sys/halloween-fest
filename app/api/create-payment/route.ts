import { Order } from "mercadopago";
import { NextResponse } from "next/server";
import { mercadoPago } from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type TipoIngresso = "normal" | "open";

type DadosCompra = {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  tipo?: TipoIngresso;
};

function calcularValor(tipo: TipoIngresso) {
  if (tipo === "open") {
    return 55;
  }

  const agora = new Date();
  const mudancaDePreco = new Date(
    "2026-10-10T20:00:00-03:00"
  );

  return agora >= mudancaDePreco ? 40 : 30;
}

export async function POST(request: Request) {
  try {
    const dados: DadosCompra = await request.json();

    const nome = dados.nome?.trim();
    const email = dados.email?.trim().toLowerCase();
    const telefone = dados.telefone?.trim();
    const cpf = dados.cpf?.replace(/\D/g, "");
    const tipo = dados.tipo;

    if (!nome || !email || !telefone || !cpf || !tipo) {
      return NextResponse.json(
        { erro: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { erro: "Digite um e-mail válido." },
        { status: 400 }
      );
    }

    if (cpf.length !== 11) {
      return NextResponse.json(
        { erro: "Digite um CPF válido com 11 números." },
        { status: 400 }
      );
    }

    if (tipo !== "normal" && tipo !== "open") {
      return NextResponse.json(
        { erro: "Tipo de ingresso inválido." },
        { status: 400 }
      );
    }

    const valorIngresso = calcularValor(tipo);
    const tipoBanco =
      tipo === "open" ? "open_gin_10" : "normal";

    /*
     * Primeiro criamos o pedido no Supabase.
     * O ID gerado será usado como referência no Mercado Pago.
     */
    const { data: ingresso, error: erroIngresso } =
      await supabaseAdmin
        .from("ingressos")
        .insert({
          nome,
          email,
          telefone,
          tipo: tipoBanco,
          valor: valorIngresso,
          status: "pendente",
        })
        .select("id")
        .single();

 if (erroIngresso || !ingresso) {
  console.error(
    "Erro ao salvar pedido no Supabase:",
    erroIngresso
  );

  if (
    erroIngresso?.message?.includes(
      "OPEN_GIN_10_ESGOTADO"
    )
  ) {
    return NextResponse.json(
      {
        erro:
          "Os 50 ingressos Open Gin de 10 já foram vendidos.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { erro: "Não foi possível registrar o pedido." },
    { status: 500 }
  );
}

    const referencia = ingresso.id;

    const modoTeste =
      process.env.MERCADO_PAGO_MODO_TESTE === "true";

    const valorMercadoPago = modoTeste
      ? 50
      : valorIngresso;

    const valorFormatado =
      valorMercadoPago.toFixed(2);

    const partesNome = nome.split(/\s+/);
    const primeiroNome = partesNome[0];
    const sobrenome =
      partesNome.slice(1).join(" ") || "Cliente";

    const order = new Order(mercadoPago);

    const resultado = await order.create({
      body: {
        type: "online",
        processing_mode: "automatic",
        total_amount: valorFormatado,
        external_reference: referencia,

        payer: modoTeste
          ? {
              email: "test_user_br@testuser.com",
              first_name: "APRO",
            }
          : {
              email,
              first_name: primeiroNome,
              last_name: sobrenome,
            },

         transactions: {
          payments: [
            {
              amount: valorFormatado,
              expiration_time: "PT30M",
              payment_method: {
                id: "pix",
                type: "bank_transfer",
              },
            },
          ],
        },
      },

      requestOptions: {
        idempotencyKey: referencia,
      },
});
    const pagamento =
      resultado.transactions?.payments?.[0];

    const metodoPagamento =
      pagamento?.payment_method;

    if (
      !resultado.id ||
      !pagamento?.id ||
      !metodoPagamento?.qr_code
    ) {
      console.error(
        "Resposta incompleta do Mercado Pago:",
        resultado
      );

      await supabaseAdmin
        .from("ingressos")
        .update({ status: "cancelado" })
        .eq("id", referencia);

      return NextResponse.json(
        {
          erro:
            "O Mercado Pago não retornou os dados do Pix.",
        },
        { status: 502 }
      );
    }

    /*
     * Atualizamos o pedido com os identificadores
     * e o código Pix retornados pelo Mercado Pago.
     */
    const { error: erroAtualizacao } =
      await supabaseAdmin
        .from("ingressos")
        .update({
          mercado_pago_id: String(resultado.id),
          pagamento_id: String(pagamento.id),
          pix_copia_cola: metodoPagamento.qr_code,
        })
        .eq("id", referencia);

    if (erroAtualizacao) {
      console.error(
        "Erro ao atualizar pedido no Supabase:",
        erroAtualizacao
      );

      return NextResponse.json(
        {
          erro:
            "O Pix foi criado, mas houve um erro ao registrar seus dados.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      pedidoId: referencia,
      ordemId: String(resultado.id),
      pagamentoId: String(pagamento.id),
      status: pagamento.status,
      valor: valorMercadoPago,
      valorIngresso,
      modoTeste,
      qrCode: metodoPagamento.qr_code,
      qrCodeBase64:
        metodoPagamento.qr_code_base64,
      ticketUrl: metodoPagamento.ticket_url,
    });
  } catch (erro) {
    console.error(
      "Erro ao criar pedido Pix:",
      erro
    );

    return NextResponse.json(
      {
        erro:
          "Não foi possível criar o pagamento Pix.",
      },
      { status: 500 }
    );
  }
}
