export default function Hero() {
  return (
    <section
    className="relative min-h-[72vw] bg-black bg-[length:130%_auto] bg-[position:center_top] bg-no-repeat md:min-h-[85vh] md:bg-cover md:bg-center"
      style={{
        backgroundImage: "url('/capa-halloween.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex min-h-[72vw] md:min-h-[85vh]npm run build items-end justify-center px-6 pb-10 md:justify-start md:px-24 md:pb-20">
        <a
          href="#ingressos"
          className="rounded-xl bg-orange-500 px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(249,115,22,0.45)] transition hover:scale-105 hover:bg-orange-400"
        >
          Garantir ingresso
        </a>
      </div>
    </section>
  );
}

