"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type TipoIngresso = "normal" | "open";

type RespostaPix = {
  sucesso?: boolean;
  erro?: string;
  pedidoId?: string;
  pagamentoId?: string;
  status?: string;
  valor?: number;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
};

export default function FormularioCompra() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoIngresso>("normal");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const precoNormal = useMemo(() => {
    const agora = new Date();
    const mudanca = new Date("2026-10-10T20:00:00-03:00");

    return agora >= mudanca ? 40 : 30;
  }, []);

  const valor = tipo === "open" ? 55 : precoNormal;

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setErro("");

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      setErro("Digite um CPF válido com 11 números.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf: cpfLimpo,
          tipo,
        }),
      });

      const dados: RespostaPix = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ?? "Não foi possível gerar o pagamento."
        );
      }

      sessionStorage.setItem(
        "halloween_pix",
        JSON.stringify({
          ...dados,
          comprador: {
            nome,
            email,
            telefone,
            cpf: cpfLimpo,
            tipo,
          },
        })
      );

      router.push("/pix");
    } catch (problema) {
      const mensagem =
        problema instanceof Error
          ? problema.message
          : "Ocorreu um erro ao gerar o Pix.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section
      id="comprar"
      className="relative overflow-hidden bg-black px-6 py-24 text-white"
    >
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Garanta sua entrada
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase md:text-5xl">
            Comprar ingresso
          </h2>
        </div>

        <form
          onSubmit={enviarFormulario}
          className="space-y-5 rounded-3xl border border-orange-500/30 bg-white/5 p-8 backdrop-blur"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Nome completo
            </label>

            <input
              type="text"
              required
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              E-mail
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none transition focus:border-orange-500"
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
              onChange={(evento) => setTelefone(evento.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              CPF
            </label>

            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={14}
              value={cpf}
              onChange={(evento) => setCpf(evento.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none transition focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Tipo de ingresso
            </label>

            <select
              value={tipo}
              onChange={(evento) =>
                setTipo(evento.target.value as TipoIngresso)
              }
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 outline-none transition focus:border-orange-500"
            >
              <option value="normal">
                Ingresso Normal — R${" "}
                {precoNormal.toFixed(2).replace(".", ",")}
              </option>

              <option value="open">
                Open Gin de 10 — R$ 55,00
              </option>
            </select>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total</span>

              <strong className="text-3xl text-orange-500">
                R$ {valor.toFixed(2).replace(".", ",")}
              </strong>
            </div>

            {tipo === "open" && (
              <p className="mt-3 text-sm text-purple-300">
                Lote limitado a 50 ingressos.
              </p>
            )}
          </div>

          {erro && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-orange-500 py-4 font-black uppercase text-black transition hover:scale-[1.02] hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando
              ? "Gerando o Pix..."
              : "Continuar para o Pix"}
          </button>
        </form>
      </div>
    </section>
  );
}
