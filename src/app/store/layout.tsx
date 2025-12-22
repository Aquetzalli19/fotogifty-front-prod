import StoreNavbar from "@/components/store/StoreNavbar";
import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "FotoGifty - Store",
  description: "Store management",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={['store']} redirectTo="/login/store">
      <div>
        <StoreNavbar />
        <main className="w-full overflow-x-clip">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
