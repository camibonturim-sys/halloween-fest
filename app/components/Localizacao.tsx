export default function Localizacao() {
  const endereco =
    "Estrada do Charqueado, 14 - Chácara São Geraldo, Embu-Guaçu - SP, 06920-240";

  const mapa =
    "https://www.google.com/maps?q=Estrada%20do%20Charqueado%2C%2014%20-%20Ch%C3%A1cara%20S%C3%A3o%20Geraldo%2C%20Embu-Gua%C3%A7u%20-%20SP%2C%2006920-240&output=embed";

  return (
    <section
      id="local"
      className="relative overflow-hidden bg-zinc-950 px-6 py-24 text-white"
    >
      <div className="absolute left-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Onde vai acontecer
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase md:text-6xl">
            Local da festa
          </h2>

          <div className="mt-8 rounded-3xl border border-orange-500/30 bg-white/5 p-7 backdrop-blur">
            <p className="text-xl font-bold text-white">
              📍 Estrada do Charqueado, 14
            </p>

            <p className="mt-3 leading-7 text-zinc-400">
              Chácara São Geraldo
              <br />
              Embu-Guaçu – SP
              <br />
              CEP 06920-240
            </p>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                endereco
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block rounded-xl bg-orange-500 px-6 py-4 font-black uppercase text-black transition hover:bg-orange-400"
            >
              Abrir no Google Maps
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
          <iframe
            src={mapa}
            width="100%"
            height="430"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa da Halloween Fest"
            className="border-0"
          />
        </div>
      </div>
    </section>
  );
}
