"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  Menu,
  X,
  Package,
  Boxes,
  Tags,
  Users,
  LogOut,
  BarChart3,
  FileText,
  MapPin,
  LayoutDashboard,
  ChevronDown,
  Settings,
  ShoppingCart,
  ListOrdered,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/modeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdmiNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, _hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Esperar a que el store se hidrate antes de mostrar los datos del usuario
  useEffect(() => {
    if (_hasHydrated) {
      setIsReady(true);
    }
  }, [_hasHydrated]);

  // Grupos de navegación organizados por categoría
  const navGroups = {
    operations: {
      label: "Operaciones",
      icon: ShoppingCart,
      items: [
        { href: "/admin", label: "Pedidos", icon: Package },
        { href: "/admin/estados-pedido", label: "Estados de Pedido", icon: ListOrdered },
      ],
    },
    catalog: {
      label: "Catálogo",
      icon: Boxes,
      items: [
        { href: "/admin/itemcontrol", label: "Paquetes", icon: Boxes },
        { href: "/admin/categories", label: "Categorías", icon: Tags },
      ],
    },
    users: {
      label: "Usuarios",
      icon: Users,
      items: [
        { href: "/admin/users", label: "Gestión de Usuarios", icon: Users },
      ],
    },
    analytics: {
      label: "Analítica",
      icon: BarChart3,
      items: [
        { href: "/admin/analytics", label: "Dashboard Analytics", icon: BarChart3 },
      ],
    },
    content: {
      label: "Contenido",
      icon: LayoutDashboard,
      items: [
        { href: "/admin/landing-content", label: "Landing Page", icon: LayoutDashboard },
        { href: "/admin/legal-documents", label: "Documentos Legales", icon: FileText },
      ],
    },
    settings: {
      label: "Configuración",
      icon: Settings,
      items: [
        { href: "/admin/store-settings", label: "Configuración Tienda", icon: MapPin },
      ],
    },
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (items: typeof navGroups.operations.items) => {
    return items.some(item => isActive(item.href));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login/admin';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="w-full sticky top-0 bg-background z-50 border-b shadow-sm">
      {/* Main navbar container */}
      <div className="w-full flex flex-row justify-between items-center py-2 sm:py-3 px-3 sm:px-4 lg:px-6">
        {/* Logo */}
        <Link href="/admin" className="shrink-0">
          <Image
            src="/navBarLogo.png"
            width={180}
            height={60}
            alt="FotoGifty Logo"
            className="w-[120px] sm:w-[150px] lg:w-[180px] h-auto"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 rounded-md text-foreground hover:bg-muted transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Desktop navigation - Dropdowns agrupados */}
        <div className="hidden lg:flex flex-row gap-1 items-center">
          {Object.entries(navGroups).map(([key, group]) => {
            const GroupIcon = group.icon;
            const groupActive = isGroupActive(group.items);

            return (
              <DropdownMenu key={key}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={groupActive ? "secondary" : "outline"}
                    className={`text-sm gap-2 ${
                      groupActive
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "text-foreground border-transparent hover:border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span className="hidden xl:inline">{group.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className={active ? "bg-primary/10 text-primary" : ""}>
                          <ItemIcon className="h-4 w-4 mr-2" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      </Link>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {/* User info and logout */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l">
            {isReady && user && (
              <div className="hidden xl:block text-right mr-2">
                <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </p>
              </div>
            )}
            <ModeToggle />
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-sm gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu - Grupos expandibles */}
      <div
        className={`lg:hidden absolute left-0 right-0 top-full bg-background border-b shadow-lg transition-all duration-300 ease-in-out max-h-[80vh] overflow-y-auto ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-3 gap-1">
          {Object.entries(navGroups).map(([key, group]) => {
            const GroupIcon = group.icon;
            const groupActive = isGroupActive(group.items);

            return (
              <div key={key} className="space-y-1">
                <div className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${groupActive ? "text-primary" : "text-muted-foreground"}`}>
                  <GroupIcon className="h-4 w-4" />
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                    >
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 text-sm pl-8 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* User info section */}
          {isReady && user && (
            <div className="mt-2 pt-3 border-t">
              <div className="px-3 pb-2">
                <p className="text-sm font-medium text-foreground">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Theme toggle and Logout button */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t">
            <ModeToggle />
            <Button
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-[-1]"
          onClick={closeMobileMenu}
        />
      )}
    </nav>
  );
};

export default AdmiNavbar;
