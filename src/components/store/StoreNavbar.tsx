"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

const StoreNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, _hasHydrated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Esperar a que el store se hidrate antes de mostrar los datos del usuario
  useEffect(() => {
    if (_hasHydrated) {
      setIsReady(true);
    }
  }, [_hasHydrated]);

  const handleLogout = () => {
    logout();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }

    window.location.href = '/login/store';
  };

  return (
    <div className="w-full flex flex-col sticky top-0 bg-background z-50">
      <div className="w-full flex flex-row justify-between items-center py-3 px-4">
        <Link href="/store">
          <Image
            src="/navBarLogo.png"
            width={150}
            height={50}
            alt="FotoGifty Logo"
            className="max-w-[150px] sm:max-w-[200px]"
          />
        </Link>

        <button
          className="md:hidden p-2 rounded-md text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        <div className="hidden md:flex flex-row gap-2 lg:gap-4 px-2 items-center">
          <Link href="/store">
            <Button
              variant="outline"
              className="border-0 text-sm sm:text-base"
            >
              Control de pedidos
            </Button>
          </Link>
          {isReady && user && (
            <div className="hidden md:block mr-4">
              <p className="text-sm text-muted-foreground">{user.nombre} {user.apellido}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="text-sm sm:text-base"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div
        className={`md:hidden w-full transition-all ease-in-out duration-300 ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="flex flex-col gap-2 p-4 pt-0">
          <Link
            href="/store"
            className="w-full"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Button
              variant="outline"
              className="w-full justify-start border-0 text-base"
            >
              Control de pedidos
            </Button>
          </Link>
          {isReady && user && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">{user.nombre} {user.apellido}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            className="w-full text-base"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreNavbar;
