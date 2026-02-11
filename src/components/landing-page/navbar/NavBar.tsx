"use client";

import { ModeToggle } from "@/components/modeToggle";
import { navbarLinks } from "@/interfaces/navbar";
import { Menu, X, User, ShoppingCart, Package, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCustomizationStore } from "@/stores/customization-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface navBarProps {
  sections: navbarLinks[];
}

const NavBar = ({ sections }: navBarProps) => {
  const [opened, setOpened] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  // Cerrar menú cuando cambia el tamaño de pantalla a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpened(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [opened]);

  const closeMenu = () => setOpened(false);

  const handleLogout = async () => {
    // Sincronizar datos pendientes con el backend antes de limpiar
    const validCustomizations = useCustomizationStore.getState().customizations
      .filter((c) => c.cartItemId != null && !isNaN(c.cartItemId) && c.instanceIndex != null && !isNaN(c.instanceIndex));
    try {
      await Promise.all([
        useCartStore.getState().syncToBackend(),
        ...validCustomizations.map((c) =>
          useCustomizationStore.getState().syncCustomizationToBackend(c.cartItemId, c.instanceIndex)
        ),
      ]);
    } catch (e) {
      console.warn('Error sincronizando antes de logout:', e);
    }

    // logout() limpia todos los datos locales
    logout();
    closeMenu();

    // Redirigir al login
    window.location.href = '/login';
  };

  return (
    <nav className="bg-background w-full z-50 sticky top-0 transition-all border-b border-border">
      {/* Header - siempre visible */}
      <div className="w-full flex flex-row justify-between items-center px-4 lg:px-6 h-16 lg:h-20 relative z-50 bg-background">
        <Link
          href={"/"}
          className="h-12 lg:h-14 w-auto"
          scroll={false}
        >
          <Image
            src={"/navBarLogo.png"}
            alt="logo"
            width={2200}
            height={573}
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex flex-row text-foreground font-light text-base">
            {sections.map((el, index) => (
              <Link
                href={el.href}
                key={index}
                className="px-4 py-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                {el.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            // Usuario logueado - mostrar menú de usuario
            <div className="flex flex-row items-center gap-3 ml-4">
              <Link
                href="/user/cart"
                className="p-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{user?.nombre || "Usuario"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/user/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/user/backlog" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Mis Pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/user/cart" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Carrito
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // Usuario no logueado - mostrar botones de login/registro
            <div className="flex flex-row gap-3 text-primary-foreground text-sm font-medium ml-4">
              <Link
                className="bg-primary rounded-lg px-4 py-2 hover:bg-primary/80 transition-colors"
                href={"/login"}
              >
                Inicia sesión
              </Link>
              <Link
                className="bg-secondary rounded-lg px-4 py-2 hover:bg-secondary/80 transition-colors"
                href={"/signup"}
              >
                Regístrate
              </Link>
            </div>
          )}

          <ModeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="flex flex-row gap-3 lg:hidden items-center">
          <ModeToggle />
          <button
            onClick={() => setOpened(!opened)}
            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={opened ? "Cerrar menú" : "Abrir menú"}
          >
            {opened ? (
              <X width={24} height={24} strokeWidth={1.5} />
            ) : (
              <Menu width={24} height={24} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {opened && (
        <div
          className="fixed inset-0 top-16 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 left-0 right-0 bg-background z-40 lg:hidden transform transition-transform duration-300 ease-in-out ${
          opened ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-4 border-t border-border">
          {/* Navigation links */}
          <div className="flex flex-col">
            {sections.map((el, index) => (
              <Link
                href={el.href}
                key={index}
                onClick={closeMenu}
                className="py-3 px-4 text-foreground font-light text-lg rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                {el.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            // Usuario logueado - menú mobile
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.nombre || "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Link
                href="/user/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
              </Link>

              <Link
                href="/user/backlog"
                onClick={closeMenu}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                <Package className="w-5 h-5" />
                <span>Mis Pedidos</span>
              </Link>

              <Link
                href="/user/cart"
                onClick={closeMenu}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Carrito</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors text-destructive"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : (
            // Usuario no logueado - botones mobile
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
              <Link
                className="bg-primary text-primary-foreground text-center rounded-lg py-3 px-4 font-medium hover:bg-primary/80 transition-colors"
                href={"/login"}
                onClick={closeMenu}
              >
                Inicia sesión
              </Link>
              <Link
                className="bg-secondary text-secondary-foreground text-center rounded-lg py-3 px-4 font-medium hover:bg-secondary/80 transition-colors"
                href={"/signup"}
                onClick={closeMenu}
              >
                Regístrate
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
