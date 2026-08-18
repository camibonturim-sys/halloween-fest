"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DadosPix = {
  sucesso: boolean;
  pedidoId: string;
  pagamentoId: string;
  status?: string;
  valor: number;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  comprador?: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    tipo: "normal" | "open";
  };
};

export default function PagamentoPixPage() {
  const router = useRouter();

  const [dados, setDados] = useState<DadosPix | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);

useEffect(() => {
  let intervalo:
    | ReturnType<typeof setInterval>
    | undefined;

  const pagamentoSalvo =
    sessionStorage.getItem("halloween_pix");

  if (!pagamentoSalvo) {
    setCarregando(false);
    return;
  }

  try {
    const pagamento = JSON.parse(
      pagamentoSalvo
    ) as DadosPix;

    setDados(pagamento);
    setCarregando(false);

    async function verificarPagamento() {
      try {
        const resposta = await fetch(
          `/api/ingresso/${encodeURIComponent(
            pagamento.pedidoId
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!resposta.ok) {
          return;
        }

        const ingresso = await resposta.json();

        if (ingresso.status === "pago") {
          sessionStorage.removeItem(
            "halloween_pix"
          );

          router.replace(
            `/ingresso/${pagamento.pedidoId}`
          );
        }
      } catch (erro) {
        console.error(
          "Erro ao verificar pagamento:",
          erro
        );
      }
    }

    verificarPagamento();

    intervalo = setInterval(
      verificarPagamento,
      5000
    );
  } catch {
    setDados(null);
    setCarregando(false);
  }

  return () => {
    if (intervalo) {
      clearInterval(intervalo);
    }
  };
}, [router]);

  async function copiarCodigoPix() {
    if (!dados?.qrCode) return;

    try {
      await navigator.clipboard.writeText(dados.qrCode);
      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2500);
    } catch {
      alert("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <p className="text-xl font-bold text-orange-400">
          Carregando pagamento...
        </p>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-zinc-900 p-8 text-center">
          <h1 className="text-3xl font-black">
            Pagamento não encontrado
          </h1>

          <p className="mt-4 text-zinc-400">
            Volte ao site e preencha o formulário novamente.
          </p>

          <button
            onClick={() => router.push("/#comprar")}
            className="mt-7 rounded-xl bg-orange-500 px-7 py-4 font-black uppercase text-black"
          >
            Voltar para a compra
          </button>
        </div>
      </main>
    );
  }

  const imagemQrCode = dados.qrCodeBase64
    ? dados.qrCodeBase64.startsWith("data:")
      ? dados.qrCodeBase64
      : `data:image/png;base64,${dados.qrCodeBase64}`
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-16 text-white">
      <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rounded-3xl border border-orange-500/30 bg-zinc-950 p-7 text-center shadow-[0_0_50px_rgba(249,115,22,0.12)] md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase">
            Pague com Pix
          </h1>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            Aguardando pagamento
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5">
            {imagemQrCode ? (
              <img
                src={imagemQrCode}
                alt="QR Code para pagamento Pix"
                className="mx-auto w-full max-w-72"
              />
            ) : (
              <p className="py-20 text-black">
                QR Code não disponível.
              </p>
            )}
          </div>

          <p className="mt-6 text-zinc-400">
            Abra o aplicativo do seu banco e escaneie o QR Code ou use o
            código Pix Copia e Cola.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Pix Copia e Cola
            </p>

            <textarea
              readOnly
              value={dados.qrCode}
              className="h-28 w-full resize-none bg-transparent text-sm text-zinc-300 outline-none"
            />
          </div>

          <button
            onClick={copiarCodigoPix}
            className="mt-4 w-full rounded-xl bg-orange-500 py-4 font-black uppercase text-black transition hover:bg-orange-400"
          >
            {copiado ? "Código copiado!" : "Copiar código Pix"}
          </button>

          <div className="mt-7 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Valor</span>

              <strong className="text-2xl text-orange-400">
                R$ {Number(dados.valor).toFixed(2).replace(".", ",")}
              </strong>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-zinc-500">Pagamento</span>
              <span className="break-all text-zinc-300">
                #{dados.pagamentoId}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-7 text-sm font-bold text-zinc-400 transition hover:text-white"
          >
            Voltar para o site
          </button>
        </div>
      </div>
    </main>
  );
}
