"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { FooterEditor } from "@/components/admin/footer/FooterEditor";
import { obtenerFooterConfig } from "@/services/footer-config";
import type { FooterConfig } from "@/interfaces/footer-config";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

export default function FooterSettingsPage() {
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, removeToast, success, error } = useToast();

  const loadFooterConfig = async () => {
    setIsLoading(true);
    try {
      const config = await obtenerFooterConfig();
      setFooterConfig(config);
    } catch (err) {
      console.error("Error loading footer config:", err);
      error("Error al cargar la configuración del footer");
      // Crear configuración vacía por defecto
      setFooterConfig({
        id: 1,
        descripcion: null,
        email: null,
        telefono: null,
        socialLinks: [],
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFooterConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !footerConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Configuración del Footer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona el contenido del footer de la landing page
          </p>
        </div>

        <FooterEditor
          initialConfig={footerConfig}
          onConfigUpdated={loadFooterConfig}
          onSuccess={success}
          onError={error}
        />
      </div>
    </>
  );
}
