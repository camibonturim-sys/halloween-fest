"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
  const evento = new Date("2026-10-10T20:00:00").getTime();

  const [tempo, setTempo] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
  });

  useEffect(() => {
    function atualizar() {
      const diferenca = evento - Date.now();

      setTempo({
        dias: Math.max(0, Math.floor(diferenca / (1000 * 60 * 60 * 24))),
        horas: Math.max(
          0,
          Math.floor((diferenca / (1000 * 60 * 60)) % 24)
        ),
        minutos: Math.max(
          0,
          Math.floor((diferenca / (1000 * 60)) % 60)
        ),
        segundos: Math.max(0, Math.floor((diferenca / 1000) % 60)),
      });
    }

    atualizar();

    const timer = setInterval(atualizar, 1000);

    return () => clearInterval(timer);
  }, [evento]);

  const itens = [
    { valor: tempo.dias, texto: "Dias" },
    { valor: tempo.horas, texto: "Horas" },
    { valor: tempo.minutos, texto: "Minutos" },
    { valor: tempo.segundos, texto: "Segundos" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-orange-500/30 bg-black px-6 py-14 text-white">
      <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
          Contagem regressiva
        </p>

        <h2 className="mt-3 text-3xl font-black uppercase md:text-5xl">
          Falta pouco para a festa começar
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {itens.map((item) => (
            <div
              key={item.texto}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <p className="text-4xl font-black text-orange-500 md:text-6xl">
                {String(item.valor).padStart(2, "0")}
              </p>

              <span className="mt-2 block uppercase tracking-widest text-zinc-400">
                {item.texto}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
