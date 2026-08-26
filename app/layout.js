import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "LYCT TEAM",
  description: "LYCT TEAM - Demon List",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-base-950 font-display antialiased text-white">
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://media.discordapp.net/attachments/1472081555903090841/1542295845074894898/Proyecto_nuevo.png?ex=6a90b66f&is=6a8f64ef&hm=5c28530dd1e7021829cebdcdcdc95360725191f568c6ea5806bab55a5540ddbb&=&format=webp&quality=lossless&width=1024&height=576)` }}
        />
        <div className="fixed inset-0 -z-10 bg-base-950/80" />
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
