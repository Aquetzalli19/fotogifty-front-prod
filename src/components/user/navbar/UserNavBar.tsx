"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import UserNavBarButton from "./UserNavBarButton";
import {
  ArchiveIcon,
  HomeIcon,
  MenuIcon,
  UserCircle,
  XIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const UserNavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    // Limpiar datos de sesión
    logout();

    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }

    // Redirigir al login
    window.location.href = '/login';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-30 p-2 rounded-md bg-zinc-800 text-white shadow-lg`}
        aria-label="Abrir menú"
      >
        <MenuIcon size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/40 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <nav
        className={`h-screen w-64 bg-zinc-900 fixed z-40 top-0 left-0 transform transition-transform duration-300 ease-in-out flex flex-col justify-between items-center py-2 ${
          isOpen
            ? "translate-x-0"
            : "translate-x-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Close button inside the sidebar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md bg-zinc-800 text-white"
          aria-label="Cerrar menú"
        >
          <XIcon size={20} />
        </button>

        <div className="w-full flex flex-col items-center content-center space-y-8 pt-12">
          <Link href={"/"} className="h-fit w-3/4">
            <Image
              src={"/navBarLogoWhite.png"}
              alt="logo"
              width={2200}
              height={573}
              className=" h-auto w-full object-fit"
            />
          </Link>

          <div className=" w-full px-2 flex flex-col gap-4">
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

          {user && (
            <div className="w-full px-4 py-2 border-t border-zinc-700 mt-4">
              <p className="text-zinc-300 text-sm truncate">Hola, {user.nombre} {user.apellido}</p>
              <p className="text-zinc-400 text-xs truncate">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="underline text-zinc-200 text-lg hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </nav>
    </>
  );
};

export default UserNavBar;
