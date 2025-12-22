import NavBar from "@/components/landing-page/navbar/NavBar";
import Footer from "@/components/landing-page/sections/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { navbarLinks } from "@/interfaces/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const sections: navbarLinks[] = [
    { label: "Prints", href: "#prints" },
    { label: "Calendarios", href: "#calendars" },
    { label: "Polaroids", href: "#polaroids" },
    { label: "Ampliaciones", href: "#extensions" },
  ];
  return (
    <div className="w-full min-h-screen flex flex-grow flex-col font-raleway">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {" "}
        <NavBar sections={sections} />
        <div className=" flex-1">
          <main className="">{children}</main>
        </div>
        <Footer />
      </ThemeProvider>
    </div>
  );
}
