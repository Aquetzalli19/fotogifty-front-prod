"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditModal from "@/components/user/main/edit-modal/EditModal";
import EmailEdit from "@/components/user/main/edit-modal/EmailEdit";
import PasswordEdit from "@/components/user/main/edit-modal/PasswordEdit";
import PhoneEdit from "@/components/user/main/edit-modal/PhoneEdit";
import NameEdit from "@/components/user/main/edit-modal/NameEdit";
import { Cliente } from "@/interfaces/users";
import { obtenerUsuarioActual } from "@/services/auth";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const { user: currentUser, updateUserData } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  // Forzar re-render cuando el usuario cambia
  useEffect(() => {
    if (currentUser) {
      setRefreshKey(prev => prev + 1);
    }
  }, [currentUser?.nombre, currentUser?.apellido, currentUser?.email, currentUser?.telefono]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Usar directamente el usuario del store si ya está disponible
        if (currentUser) {
          setLoading(false);
          return;
        }

        // Si no está en el store, obtenerlo del endpoint /auth/me
        const response = await obtenerUsuarioActual();
        if (response.success && response.data) {
          // Actualizar el usuario en el store
          updateUserData(response.data);
        } else {
          showError(response.message || 'Error al cargar la información del usuario');
        }
      } catch (error) {
        console.error('Error al cargar la información del usuario:', error);
        showError('Error al cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, updateUserData, showError]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 md:px-20 py-12 gap-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-center">
          Cargando información de tu <span className="text-secondary">cuenta</span>
        </h1>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 md:px-20 py-12 gap-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-center">
          Error al cargar tu <span className="text-secondary">cuenta</span>
        </h1>
        <p>No se pudo cargar la información del usuario.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-20 py-12 gap-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl text-center">
        Información de tu <span className="text-secondary">cuenta</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto" key={`profile-${refreshKey}`}>
        {/* Sección de Nombre y Apellido con modal de edición */}
        <div className="mb-4 border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-lg font-semibold">Nombre y Apellido</h3>
            <EditModal
              title="Editar nombre y apellido"
              trigger={
                <Button type="button" className="border border-primary bg-background text-primary hover:text-primary-foreground">
                  Editar
                </Button>
              }
              content={({ closeModal }) => (
                <NameEdit
                  prevNombre={currentUser.nombre}
                  prevApellido={currentUser.apellido}
                  userId={currentUser.id}
                  onSuccess={closeModal}
                />
              )}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Nombre</label>
              <Input
                type="text"
                id="name"
                value={currentUser.nombre}
                disabled
                className="bg-zinc-200 text-zinc-700 font-medium text-base sm:text-lg"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Apellido</label>
              <Input
                type="text"
                id="lastName"
                value={currentUser.apellido}
                disabled
                className="bg-zinc-200 text-zinc-700 font-medium text-base sm:text-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6">
          <div className="w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg">Número de teléfono:</h3>
              <EditModal
                title="Editar número de teléfono"
                trigger={
                  <Button className="border border-primary bg-background text-primary hover:text-primary-foreground">
                    Editar
                  </Button>
                }
                content={({ closeModal }) => (
                  <PhoneEdit
                    prevPhone={currentUser.telefono || ''}
                    userId={currentUser.id}
                    onSuccess={closeModal}
                  />
                )}
              />
            </div>
            <Input
              type="text"
              id="phone"
              value={currentUser.telefono || ''}
              disabled
              className="bg-zinc-200 text-secondary font-medium text-base sm:text-lg"
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg">Correo electrónico:</h3>
              <EditModal
                title="Editar correo electrónico"
                trigger={
                  <Button className="border border-primary bg-background text-primary hover:text-primary-foreground">
                    Editar
                  </Button>
                }
                content={({ closeModal }) => (
                  <EmailEdit
                    prevEmail={currentUser.email}
                    userId={currentUser.id}
                    onSuccess={closeModal}
                  />
                )}
              />
            </div>
            <Input
              type="text"
              id="email"
              value={currentUser.email}
              disabled
              className="bg-zinc-200 text-secondary font-medium text-base sm:text-lg"
            />
          </div>
        </div>

        <div className="flex flex-col w-full mt-4">
          <div className="w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg">Contraseña:</h3>
              <EditModal
                title="Editar contraseña"
                trigger={
                  <Button className="border border-primary bg-background text-primary hover:text-primary-foreground">
                    Editar
                  </Button>
                }
                content={({ closeModal }) => (
                  <PasswordEdit
                    userId={currentUser.id}
                    onSuccess={closeModal}
                  />
                )}
              />
            </div>
            <Input
              type="password"
              id="password"
              value="*********" // Placeholder, no se revela la contraseña real
              disabled
              className="bg-zinc-200 text-secondary font-medium text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Sección de direcciones */}
        <div className="flex flex-col w-full mt-4">
          <div className="w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg">Direcciones:</h3>
              <Button variant="outline" className="border border-primary bg-background text-primary hover:text-primary-foreground" asChild>
                <Link href="/user/profile/addresses">Gestionar</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Administra tus direcciones de envío
            </p>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ProfilePage;
