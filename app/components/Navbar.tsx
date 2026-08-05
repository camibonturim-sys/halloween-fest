export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-orange-500">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <h1 className="text-2xl font-black text-orange-500">
          🎃 Halloween Fest
        </h1>

        <nav className="flex gap-6">
          <a href="#ingressos" className="hover:text-orange-500">
            Ingressos
          </a>

          <a href="#comprar" className="hover:text-orange-500">
            Comprar
          </a>
        </nav>
      </div>
    </header>
  );
}
