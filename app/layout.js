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
