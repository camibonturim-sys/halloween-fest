import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Countdown from "./components/Countdown";
import Ingressos from "./components/Ingressos";
import FormularioCompra from "./components/FormularioCompra";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Countdown />
      <Ingressos />
      <FormularioCompra />
      <Localizacao />
      <Footer />
    </main>
  );
}
import Localizacao from "./components/Localizacao";
