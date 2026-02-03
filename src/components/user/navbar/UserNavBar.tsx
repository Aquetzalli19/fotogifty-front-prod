"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import UserNavBarButton from "./UserNavBarButton";
import {
  ArchiveIcon,
  HomeIcon,
  MenuIcon,
  UserCircle,
  XIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ModeToggle } from "@/components/modeToggle";

const UserNavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, _hasHydrated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Esperar a que el store se hidrate antes de mostrar los datos del usuario
  useEffect(() => {
    if (_hasHydrated) {
      setIsReady(true);
    }
  }, [_hasHydrated]);

  const handleLogout = () => {
    // logout() ahora limpia automáticamente:
    // - Token de autenticación
    // - Carrito de compras
    // - Customizaciones de fotos
    // - Datos del paso del carrito
    logout();

    // Redirigir al login
    window.location.href = '/login';
  };

  return (
    <>
      {/* Botón de menú solo visible en móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-primary text-primary-foreground shadow-lg"
        aria-label="Abrir menú"
      >
        <MenuIcon size={24} />
      </button>

      {/* Overlay solo en móvil cuando el menú está abierto */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <nav
        className={`h-screen w-64 bg-sidebar dark:bg-sidebar fixed z-40 top-0 left-0 transform transition-transform duration-300 ease-in-out flex flex-col justify-between items-center py-2
        lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
        ${
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Botón de cerrar solo visible en móvil */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 rounded-md bg-sidebar-accent text-sidebar-foreground"
          aria-label="Cerrar menú"
        >
          <XIcon size={20} />
        </button>

        <div className="w-full flex flex-col items-center content-center space-y-8 pt-12">
          <Link href={"/user"} className="h-fit w-3/4">
            <Image
              src={"/navBarLogoWhite.png"}
              alt="logo"
              width={2200}
              height={573}
              className="h-auto w-full object-fit dark:block hidden"
            />
            <Image
              src={"/navBarLogo.png"}
              alt="logo"
              width={2200}
              height={573}
              className="h-auto w-full object-fit dark:hidden block"
            />
          </Link>

          <div className="w-full px-2 flex flex-col gap-4">
            <UserNavBarButton
              href="/user"
              title="Inicio"
              icon={<HomeIcon size={24} />}
            />
            <UserNavBarButton
              href="/user/profile"
              title="Perfil"
              icon={<UserCircle size={24} />}
            />
            <UserNavBarButton
              href="/user/backlog"
              title="Historial de pedidos"
              icon={<ArchiveIcon size={24} />}
            />
          </div>

          {isReady && user && (
            <div className="w-full px-4 py-2 border-t border-sidebar-border mt-4">
              <p className="text-sidebar-foreground text-sm truncate">Hola, {user.nombre} {user.apellido}</p>
              <p className="text-sidebar-foreground/70 text-xs truncate">{user.email}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 pb-4">
          <ModeToggle />
          <button
            onClick={handleLogout}
            className="underline text-sidebar-foreground text-lg hover:text-sidebar-foreground/80 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  );
};

export default UserNavBar;
