"use client";

import { useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

type RespostaCheckin = {
  sucesso?: boolean;
  mensagem?: string;
  erro?: string;
  status?: string;
  checkinEm?: string;
  ingresso?: {
    id: string;
    tipo: string;
    valor: number;
    status: string;
    checkin_em: string;
  };
};

export default function PaginaCheckin() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const controlesRef = useRef<{
    stop: () => void;
  } | null>(null);

  const processandoRef = useRef(false);

  const [pin, setPin] = useState("");
  const [cameraLigada, setCameraLigada] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<
    "sucesso" | "erro" | ""
  >("");

  function nomeIngresso(tipo?: string) {
    if (tipo === "open_gin_10") {
      return "Open Gin de 10";
    }

    return "Ingresso Normal";
  }

  function formatarValor(valor?: number) {
    if (typeof valor !== "number") {
      return "";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function formatarData(data?: string) {
    if (!data) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(data));
  }

  async function validarIngresso(qrCode: string) {
    if (processandoRef.current) {
      return;
    }

    processandoRef.current = true;
    setProcessando(true);
    setMensagem("Validando ingresso...");
    setTipoMensagem("");

    try {
      const resposta = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode,
          pin,
        }),
      });

      const dados =
        (await resposta.json()) as RespostaCheckin;

      if (!resposta.ok || !dados.sucesso) {
        if (resposta.status === 409) {
          const horario = dados.checkinEm
            ? ` Utilizado em ${formatarData(
                dados.checkinEm
              )}.`
            : "";

          setMensagem(
            `${dados.erro ?? "Ingresso não liberado."}${horario}`
          );
        } else {
          setMensagem(
            dados.erro ??
              "Não foi possível validar o ingresso."
          );
        }

        setTipoMensagem("erro");
        return;
      }

      const ingresso = dados.ingresso;

      setMensagem(
        `ENTRADA LIBERADA — ${nomeIngresso(
          ingresso?.tipo
        )} — ${formatarValor(ingresso?.valor)}`
      );

      setTipoMensagem("sucesso");
    } catch (erro) {
      console.error("Erro no check-in:", erro);

      setMensagem(
        "Erro de conexão. Tente novamente."
      );
      setTipoMensagem("erro");
    } finally {
      setProcessando(false);
    }
  }

  async function iniciarCamera() {
    if (!pin.trim()) {
      setMensagem(
        "Digite o PIN de administrador antes de iniciar."
      );
      setTipoMensagem("erro");
      return;
    }

    setMensagem("");
    setTipoMensagem("");
    processandoRef.current = false;

    controlesRef.current?.stop();
    controlesRef.current = null;

    if (!videoRef.current) {
      return;
    }

    try {
      const leitor = new BrowserQRCodeReader();

      const controles =
        await leitor.decodeFromConstraints(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
            audio: false,
          },
          videoRef.current,
          (resultado, _erro, controlesLeitura) => {
            if (
              resultado &&
              !processandoRef.current
            ) {
              const textoQr = resultado.getText();

              controlesLeitura.stop();
              controlesRef.current = null;
              setCameraLigada(false);

              validarIngresso(textoQr);
            }
          }
        );

      controlesRef.current = controles;
      setCameraLigada(true);
    } catch (erro) {
      console.error(
        "Erro ao abrir câmera:",
        erro
      );

      setCameraLigada(false);
      setMensagem(
        "Não foi possível abrir a câmera. Verifique se o navegador tem permissão para usá-la."
      );
      setTipoMensagem("erro");
    }
  }

  function pararCamera() {
    controlesRef.current?.stop();
    controlesRef.current = null;
    setCameraLigada(false);
  }

  function lerProximo() {
    setMensagem("");
    setTipoMensagem("");
    processandoRef.current = false;

    iniciarCamera();
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-lg">
        <header className="mb-7 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Halloween Fest
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">
            Check-in
          </h1>

          <p className="mt-3 text-zinc-400">
            Leia o QR Code do ingresso na entrada.
          </p>
        </header>

        <div className="rounded-3xl border border-orange-500/30 bg-zinc-950 p-5">
          <label className="mb-2 block text-sm font-bold text-zinc-300">
            PIN do administrador
          </label>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(evento) =>
              setPin(evento.target.value)
            }
            placeholder="Digite seu PIN"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-center text-xl tracking-[0.3em] outline-none focus:border-orange-500"
          />

          <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <video
              ref={videoRef}
              className="aspect-square w-full object-cover"
              muted
              playsInline
            />

            {!cameraLigada && !processando && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <p className="px-6 text-center text-zinc-400">
                  Câmera desligada
                </p>
              </div>
            )}
          </div>

          {!cameraLigada && !processando && (
            <button
              type="button"
              onClick={iniciarCamera}
              className="mt-5 w-full rounded-xl bg-orange-500 py-4 text-lg font-black uppercase text-black transition active:scale-95"
            >
              Abrir câmera
            </button>
          )}

          {cameraLigada && (
            <button
              type="button"
              onClick={pararCamera}
              className="mt-5 w-full rounded-xl border border-white/20 py-4 font-black uppercase text-white"
            >
              Parar câmera
            </button>
          )}

          {mensagem && (
            <div
              className={`mt-5 rounded-2xl border p-5 text-center ${
                tipoMensagem === "sucesso"
                  ? "border-green-500/50 bg-green-500/15 text-green-300"
                  : tipoMensagem === "erro"
                    ? "border-red-500/50 bg-red-500/15 text-red-300"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
              }`}
            >
              <p
                className={
                  tipoMensagem === "sucesso"
                    ? "text-2xl font-black"
                    : "font-bold"
                }
              >
                {mensagem}
              </p>
            </div>
          )}

          {(tipoMensagem === "sucesso" ||
            tipoMensagem === "erro") && (
            <button
              type="button"
              onClick={lerProximo}
              className="mt-5 w-full rounded-xl bg-purple-600 py-4 text-lg font-black uppercase text-white transition active:scale-95"
            >
              Ler próximo ingresso
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Cada ingresso pode ser utilizado apenas uma vez.
        </p>
      </div>
    </main>
  );
}