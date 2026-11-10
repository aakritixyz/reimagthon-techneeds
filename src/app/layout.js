import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "@/components/shell/shell.css";
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";
import TechGuide from "@/components/guide/TechGuide";

export const metadata = {
  title: "TechNeeds IGDTUW | Learn tech. Build together.",
  description: "Learn with peers, build hands-on projects, and explore technical mentorship at IGDTUW.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
        <TechGuide />
      </body>
    </html>
  );
}
