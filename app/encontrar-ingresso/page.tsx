"use client";

import Link from "next/link";
import { useState } from "react";

type IngressoEncontrado = {
  id: string;
  tipo: "normal" | "open_gin_10";
  valor: number;
  status: string;
  criadoEm: string;
  ingressoDisponivel: boolean;
};

type RespostaBusca = {
  sucesso?: boolean;
  erro?: string;
  encontrados?: IngressoEncontrado[];
};

export default function EncontrarIngressoPage() {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [resultados, setResultados] =
    useState<IngressoEncontrado[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

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

  async function procurarIngresso(
    evento: React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");
    setResultados([]);
    setBuscou(false);
    setCarregando(true);

    try {
      const resposta = await fetch(
        "/api/encontrar-ingresso",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            telefone,
          }),
        }
      );

      const dados =
        (await resposta.json()) as RespostaBusca;

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ??
            "Não foi possível procurar o ingresso."
        );
      }

      setResultados(dados.encontrados ?? []);
      setBuscou(true);
    } catch (problema) {
      const mensagem =
        problema instanceof Error
          ? problema.message
          : "Ocorreu um erro ao procurar seu ingresso.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase">
            Encontrar meu ingresso
          </h1>

          <p className="mt-4 text-zinc-400">
            Informe o mesmo e-mail e telefone usados na compra.
          </p>
        </header>

        <form
          onSubmit={procurarIngresso}
          className="mt-8 space-y-5 rounded-3xl border border-orange-500/30 bg-zinc-950 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              E-mail
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(evento) =>
                setEmail(evento.target.value)
              }
              placeholder="Digite seu e-mail"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Telefone
            </label>

            <input
              type="tel"
              required
              value={telefone}
              onChange={(evento) =>
                setTelefone(evento.target.value)
              }
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none focus:border-orange-500"
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-orange-500 py-4 font-black uppercase text-black disabled:opacity-50"
          >
            {carregando
              ? "Procurando..."
              : "Encontrar ingresso"}
          </button>
        </form>

        {buscou && resultados.length === 0 && (
          <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
            <p className="font-bold text-yellow-300">
              Nenhum ingresso encontrado com esses dados.
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Confira se usou o mesmo e-mail e telefone da compra.
            </p>
          </div>
        )}

        {resultados.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-black uppercase">
              Seus ingressos
            </h2>

            {resultados.map((ingresso) => (
              <div
                key={ingresso.id}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-orange-400">
                      {nomeIngresso(ingresso.tipo)}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      {formatarValor(ingresso.valor)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Compra em{" "}
                      {formatarData(ingresso.criadoEm)}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase text-zinc-300">
                    {ingresso.status}
                  </span>
                </div>

                {ingresso.ingressoDisponivel ? (
                  <Link
                    href={`/ingresso/${ingresso.id}`}
                    className="mt-5 block w-full rounded-xl bg-orange-500 py-4 text-center font-black uppercase text-black"
                  >
                    Abrir meu ingresso
                  </Link>
                ) : (
                  <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-sm text-yellow-300">
                    O ingresso ficará disponível assim que o pagamento for confirmado.
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        <Link
          href="/"
          className="mt-8 block text-center text-sm font-bold text-zinc-500 hover:text-white"
        >
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}