import Header from "./components/header";
import ClientHome from "./client-home";

export default async function Home() {
  return (
    <div className="min-h-screen text-lumen-black font-mono">
      <Header />
      <ClientHome />
    </div>
  );
}
