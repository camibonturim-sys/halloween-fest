export default function Ingressos() {
  return (
    <section
      id="ingressos"
      className="relative overflow-hidden bg-zinc-950 px-6 py-24 text-white"
    >
      <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Escolha sua experiência
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase md:text-6xl">
            Ingressos
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Garanta sua entrada para uma noite incrível!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <article className="group rounded-3xl border border-orange-500/40 bg-white/5 p-8 backdrop-blur transition hover:-translate-y-2 hover:border-orange-400 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase text-orange-300">
                  Lote atual
                </span>

                <h3 className="mt-5 text-3xl font-black">
                  Ingresso Normal
                </h3>
              </div>

              <span className="text-4xl">🎟️</span>
            </div>

            <p className="mt-8 text-6xl font-black text-orange-500">
              R$ 30,30
            </p>

            <p className="mt-5 leading-7 text-zinc-400">
              Entrada para a Halloween Fest. Após
              <strong className="text-white"> 10/10/2026 às 20h</strong>, o
              valor muda automaticamente para
              <strong className="text-orange-400"> R$ 40,40</strong>.
            </p>

            <a
              href="#comprar"
              className="mt-8 block rounded-xl bg-orange-500 py-4 text-center font-black uppercase text-black transition group-hover:bg-orange-400"
            >
              Comprar ingresso
            </a>
          </article>

          <article className="group relative rounded-3xl border border-purple-500/50 bg-gradient-to-br from-purple-950/70 via-zinc-900 to-orange-950/70 p-8 transition hover:-translate-y-2 hover:border-purple-400 hover:shadow-[0_0_45px_rgba(168,85,247,0.25)]">
            <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase text-black">
              Mais procurado
            </span>

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase text-purple-300">
                  Lote limitado
                </span>

                <h3 className="mt-5 text-3xl font-black">
                  Open Gin de 10
                </h3>
              </div>

              <span className="text-4xl">🍸</span>
            </div>

            <p className="mt-8 text-6xl font-black text-white">
              R$ 55,55
            </p>

            <p className="mt-5 leading-7 text-zinc-300">
              Entrada na festa com acesso ao Open Gin. Apenas
              <strong className="text-white"> 50 ingressos disponíveis</strong>.
            </p>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-zinc-300">
                <span>Disponibilidade</span>
                <span>50 unidades</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-500 to-orange-500" />
              </div>
            </div>

            <a
              href="#comprar"
              className="mt-8 block rounded-xl bg-white py-4 text-center font-black uppercase text-black transition group-hover:bg-orange-400"
            >
              Comprar Open Gin
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
