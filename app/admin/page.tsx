"use client";

import { useState } from "react";

type Resumo = {
  totalPedidos: number;
  pendentes: number;
  pagos: number;
  utilizados: number;
  cancelados: number;
  vendidos: number;
  openGinReservados: number;
  openGinRestantes: number;
};

type IngressoRecente = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  valor: number;
  status: string;
  created_at: string;
  expira_em: string | null;
  pago_em: string | null;
  checkin_em: string | null;
};

type RespostaAdmin = {
  sucesso?: boolean;
  erro?: string;
  resumo?: Resumo;
  recentes?: IngressoRecente[];
};

export default function PaginaAdmin() {
  const [pin, setPin] = useState("");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [recentes, setRecentes] = useState<IngressoRecente[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function nomeIngresso(tipo: string) {
    return tipo === "open_gin_10"
      ? "Open Gin de 10"
      : "Ingresso Normal";
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(data));
  }

  function statusExibido(ingresso: IngressoRecente) {
  if (
    ingresso.status === "pendente" &&
    ingresso.expira_em &&
    new Date(ingresso.expira_em) <= new Date()
  ) {
    return "expirado";
  }

  return ingresso.status;
}

  async function carregarPainel() {
    if (!pin.trim()) {
      setErro("Digite o PIN administrativo.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/admin/resumo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin,
        }),
        cache: "no-store",
      });

      const dados =
        (await resposta.json()) as RespostaAdmin;

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ??
            "Não foi possível carregar o painel."
        );
      }

      setResumo(dados.resumo ?? null);
      setRecentes(dados.recentes ?? []);
    } catch (problema) {
      const mensagem =
        problema instanceof Error
          ? problema.message
          : "Erro ao carregar o painel.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase md:text-5xl">
            Painel administrativo
          </h1>

          <p className="mt-3 text-zinc-400">
            Acompanhe vendas, pagamentos e entradas.
          </p>
        </header>

        <section className="mb-8 rounded-3xl border border-orange-500/30 bg-zinc-950 p-5">
          <label className="mb-2 block text-sm font-bold text-zinc-300">
            PIN administrativo
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(evento) =>
                setPin(evento.target.value)
              }
              placeholder="Digite seu PIN"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none focus:border-orange-500"
            />

            <button
              type="button"
              onClick={carregarPainel}
              disabled={carregando}
              className="rounded-xl bg-orange-500 px-7 py-4 font-black uppercase text-black disabled:opacity-50"
            >
              {carregando
                ? "Carregando..."
                : resumo
                  ? "Atualizar"
                  : "Entrar"}
            </button>
          </div>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
              {erro}
            </div>
          )}
        </section>

        {resumo && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card
                titulo="Pedidos"
                valor={resumo.totalPedidos}
              />

              <Card
                titulo="Vendidos"
                valor={resumo.vendidos}
              />

              <Card
                titulo="Pendentes"
                valor={resumo.pendentes}
              />

              <Card
                titulo="Check-ins"
                valor={resumo.utilizados}
              />

              <Card
                titulo="Pagos aguardando entrada"
                valor={resumo.pagos}
              />

              <Card
                titulo="Cancelados"
                valor={resumo.cancelados}
              />

              <Card
                titulo="Open Gin reservados"
                valor={`${resumo.openGinReservados}/50`}
              />

              <Card
                titulo="Open Gin restantes"
                valor={resumo.openGinRestantes}
                destaque
              />
            </section>

            <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-5">
                <h2 className="text-2xl font-black uppercase">
                  Pedidos recentes
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Últimos 20 registros.
                </p>
              </div>

              <div className="space-y-3">
                {recentes.length === 0 && (
                  <p className="py-8 text-center text-zinc-500">
                    Nenhum pedido encontrado.
                  </p>
                )}

                {recentes.map((ingresso) => (
                  <div
                    key={ingresso.id}
                    className="rounded-2xl border border-white/10 bg-zinc-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <p className="font-black">
                          {ingresso.nome}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          {ingresso.email}
                        </p>
                      </div>

                      <Status status={statusExibido(ingresso)} />
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
                      <p>
                        <span className="text-zinc-600">
                          Ingresso:{" "}
                        </span>
                        {nomeIngresso(ingresso.tipo)}
                      </p>

                      <p>
                        <span className="text-zinc-600">
                          Valor:{" "}
                        </span>
                        {formatarValor(
                          Number(ingresso.valor)
                        )}
                      </p>

                      <p>
                        <span className="text-zinc-600">
                          Pedido:{" "}
                        </span>
                        {formatarData(
                          ingresso.created_at
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Card({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number | string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        destaque
          ? "border-orange-500/50 bg-orange-500/10"
          : "border-white/10 bg-zinc-950"
      }`}
    >
      <p className="text-sm font-bold uppercase text-zinc-500">
        {titulo}
      </p>

      <p
        className={`mt-3 text-4xl font-black ${
          destaque
            ? "text-orange-400"
            : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function Status({
  status,
}: {
  status: string;
}) {
  const estilos: Record<string, string> = {expirado:
  "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    pendente:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",

    pago:
      "border-green-500/30 bg-green-500/10 text-green-300",

    utilizado:
      "border-purple-500/30 bg-purple-500/10 text-purple-300",

    cancelado:
      "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`self-start rounded-full border px-3 py-1 text-xs font-black uppercase ${
        estilos[status] ??
        "border-white/20 text-zinc-300"
      }`}
    >
      {status}
    </span>
  );
}