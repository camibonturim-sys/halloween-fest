"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type DadosIngresso = {
  ingressoId: string;
  status: string;
  tipo: "normal" | "open_gin_10";
  valor: number;
  pagoEm: string | null;
  qrCodeImagem: string | null;
};

type RespostaErro = {
  erro?: string;
};

function nomeDoIngresso(tipo: DadosIngresso["tipo"]) {
  if (tipo === "open_gin_10") {
    return "Open Gin de 10";
  }

  return "Ingresso Normal";
}

function formatarValor(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string | null) {
  if (!data) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export default function PaginaIngresso() {
  const parametros = useParams<{ id: string }>();
  const ingressoId = parametros.id;

  const [ingresso, setIngresso] =
    useState<DadosIngresso | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let paginaAtiva = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function buscarIngresso() {
      try {
        const resposta = await fetch(
          `/api/ingresso/${encodeURIComponent(ingressoId)}`,
          {
            cache: "no-store",
          }
        );

        const dados = (await resposta.json()) as
          | DadosIngresso
          | RespostaErro;

        if (!resposta.ok) {
          const mensagem =
            "erro" in dados && dados.erro
              ? dados.erro
              : "Não foi possível carregar o ingresso.";

          throw new Error(mensagem);
        }

        if (!paginaAtiva) {
          return;
        }

        const ingressoRecebido = dados as DadosIngresso;

        setIngresso(ingressoRecebido);
        setErro("");
        setCarregando(false);

        /*
         * Se o pagamento ainda estiver pendente,
         * consulta novamente após 5 segundos.
         */
        if (ingressoRecebido.status === "pendente") {
          temporizador = setTimeout(buscarIngresso, 5000);
        }
      } catch (problema) {
        if (!paginaAtiva) {
          return;
        }

        const mensagem =
          problema instanceof Error
            ? problema.message
            : "Ocorreu um erro ao carregar o ingresso.";

        setErro(mensagem);
        setCarregando(false);
      }
    }

    buscarIngresso();

    return () => {
      paginaAtiva = false;

      if (temporizador) {
        clearTimeout(temporizador);
      }
    };
  }, [ingressoId]);
async function compartilharIngresso() {
  const url = window.location.href;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Meu ingresso - Halloween Fest",
        text: "Meu ingresso para o Halloween Fest 🎃",
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(url);

    alert(
      "Link do ingresso copiado! Agora você pode enviar pelo WhatsApp."
    );
  } catch (erro) {
    console.error(
      "Erro ao compartilhar ingresso:",
      erro
    );
  }
}

function salvarIngresso() {
  if (!ingresso?.qrCodeImagem) {
    return;
  }

  const link = document.createElement("a");

  link.href = ingresso.qrCodeImagem;
  link.download = `ingresso-halloween-fest-${ingresso.ingressoId}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500" />

          <p className="mt-5 font-bold text-orange-400">
            Carregando ingresso...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !ingresso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-zinc-950 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">
            Halloween Fest
          </p>

          <h1 className="mt-4 text-3xl font-black">
            Ingresso não encontrado
          </h1>

          <p className="mt-4 text-zinc-400">
            {erro || "Não foi possível carregar este ingresso."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-block rounded-xl bg-orange-500 px-7 py-4 font-black uppercase text-black"
          >
            Voltar ao site
          </Link>
        </div>
      </main>
    );
  }

  if (ingresso.status === "pendente") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-yellow-500/30 bg-zinc-950 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase">
            Pagamento pendente
          </h1>

          <div className="mx-auto mt-7 h-12 w-12 animate-spin rounded-full border-4 border-yellow-500/30 border-t-yellow-400" />

          <p className="mt-6 text-zinc-400">
            Estamos aguardando a confirmação do Mercado Pago. Esta página
            será atualizada automaticamente.
          </p>

          <p className="mt-5 text-2xl font-black text-orange-400">
            {formatarValor(ingresso.valor)}
          </p>
        </div>
      </main>
    );
  }

  if (ingresso.status !== "pago" || !ingresso.qrCodeImagem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-zinc-950 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase">
            Ingresso indisponível
          </h1>

          <p className="mt-5 text-zinc-400">
            Status atual:{" "}
            <strong className="text-white">
              {ingresso.status}
            </strong>
          </p>

          <Link
            href="/"
            className="mt-7 inline-block rounded-xl bg-orange-500 px-7 py-4 font-black uppercase text-black"
          >
            Voltar ao site
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-14 text-white">
      <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-orange-500/40 bg-zinc-950 shadow-[0_0_60px_rgba(249,115,22,0.15)]">
          <div className="border-b border-orange-500/20 bg-gradient-to-r from-orange-500/20 to-purple-600/20 p-7 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
              Halloween Fest
            </p>

            <h1 className="mt-3 text-4xl font-black uppercase">
              Seu ingresso
            </h1>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Pagamento confirmado
            </div>
          </div>

          <div className="p-7">
            <div className="rounded-2xl bg-white p-5">
              <img
                src={ingresso.qrCodeImagem}
                alt="QR Code do ingresso Halloween Fest"
                className="mx-auto w-full max-w-80"
              />
            </div>

            <p className="mt-5 text-center text-sm text-zinc-400">
              Apresente este QR Code na entrada do evento.
            </p>

            <div className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400">
                  Ingresso
                </span>

                <strong className="text-right text-orange-400">
                  {nomeDoIngresso(ingresso.tipo)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400">
                  Valor
                </span>

                <strong>
                  {formatarValor(ingresso.valor)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400">
                  Pago em
                </span>

                <strong className="text-right">
                  {formatarData(ingresso.pagoEm)}
                </strong>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-200">
              Não compartilhe este QR Code. Ele é único e será validado
              apenas uma vez na entrada.
            </div>
<div className="mt-6 grid gap-3 sm:grid-cols-2">
  <button
    type="button"
    onClick={salvarIngresso}
    className="rounded-xl bg-orange-500 py-4 font-black uppercase text-black transition hover:bg-orange-400"
  >
    Salvar ingresso
  </button>

  <button
    type="button"
    onClick={compartilharIngresso}
    className="rounded-xl bg-purple-600 py-4 font-black uppercase text-white transition hover:bg-purple-500"
  >
    Compartilhar ingresso
  </button>
</div>
            <Link
              href="/"
              className="mt-7 block w-full rounded-xl border border-white/10 py-4 text-center font-black uppercase text-zinc-300 transition hover:border-orange-500 hover:text-white"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
