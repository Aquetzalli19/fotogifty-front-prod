"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { obtenerTodosStoreUsers } from "@/services/stores";
import { obtenerTodosClientes } from "@/services/usuarios";
import { StoreUser, Cliente } from "@/interfaces/users";
import { config } from "@/lib/config";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { AddStoreUserDialog } from "@/components/admin/AddStoreUserDialog";
import { EditStoreUserDialog } from "@/components/admin/EditStoreUserDialog";
import { DeleteStoreUserDialog } from "@/components/admin/DeleteStoreUserDialog";

const UsersPage = () => {
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StoreUser | null>(null);

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  // Cargar usuarios de tienda
  const loadStoreUsers = async () => {
    setIsLoadingStores(true);

    if (!config.apiUrl) {
      console.log("No API URL configured, using empty data");
      setStoreUsers([]);
      setIsLoadingStores(false);
      return;
    }

    try {
      const response = await obtenerTodosStoreUsers();

      if (response.success && response.data) {
        setStoreUsers(response.data);
      } else {
        console.warn("API call failed for store users");
        setStoreUsers([]);
      }
    } catch (err) {
      console.error("Error loading store users:", err);
      setStoreUsers([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Cargar clientes
  const loadClientes = async () => {
    setIsLoadingClientes(true);

    if (!config.apiUrl) {
      console.log("No API URL configured, using empty data");
      setClientes([]);
      setIsLoadingClientes(false);
      return;
    }

    try {
      const response = await obtenerTodosClientes();

      if (response.success && response.data) {
        setClientes(response.data);
      } else {
        console.warn("API call failed for clientes");
        setClientes([]);
      }
    } catch (err) {
      console.error("Error loading clientes:", err);
      setClientes([]);
    } finally {
      setIsLoadingClientes(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    loadStoreUsers();
    loadClientes();
  }, []);

  // Handlers
  const handleEdit = (user: StoreUser) => {
    console.log("Editando usuario:", user); // Para depuración
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: StoreUser) => {
    console.log("Eliminando usuario:", user); // Para depuración
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      {/* Notificaciones */}
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

      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-primary text-center mb-4 sm:mb-6">
          Control de Usuarios
        </h1>

        <Tabs defaultValue="stores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 gap-1 sm:gap-2">
            <TabsTrigger value="stores" className="text-sm sm:text-md">
              Usuarios de Tienda
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-sm sm:text-md">
              Clientes
            </TabsTrigger>
          </TabsList>

          {/* Tab de Usuarios de Tienda */}
          <TabsContent value="stores">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {storeUsers.length} usuario(s) de tienda
                </p>
                <Button
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Crear Usuario de Tienda</span>
                  <span className="sm:hidden">Crear Usuario</span>
                </Button>
              </div>

              {isLoadingStores ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : storeUsers.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-lg text-muted-foreground">
                    No hay usuarios de tienda registrados
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Crear primer usuario
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {storeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg truncate">
                          {user.nombre} {user.apellido}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <p className="text-xs sm:text-sm">
                          Código: {user.codigo_empleado}
                        </p>
                        <p className="text-xs sm:text-sm">Tel: {user.telefono}</p>
                        <div className="flex gap-2 mt-3 sm:mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => handleEdit(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => handleDelete(user)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab de Clientes */}
          <TabsContent value="clientes">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {clientes.length} cliente(s) registrado(s)
                </p>
              </div>

              {isLoadingClientes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg">
                  <p className="text-base sm:text-lg text-muted-foreground">
                    No hay clientes registrados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg truncate">
                          {cliente.nombre} {cliente.apellido}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {cliente.email}
                        </p>
                        <p className="text-xs sm:text-sm">Tel: {cliente.telefono}</p>
                        {cliente.total_pedidos !== undefined && (
                          <p className="text-xs sm:text-sm font-medium">
                            Pedidos: {cliente.total_pedidos}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para crear usuario */}
      <AddStoreUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUserCreated={loadStoreUsers}
        onShowToast={(message, type) =>
          type === "success" ? success(message) : showError(message)
        }
      />

      {/* Diálogo para editar usuario */}
      <EditStoreUserDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserUpdated={loadStoreUsers}
        onShowToast={(message, type) =>
          type === "success" ? success(message) : showError(message)
        }
      />

      {/* Diálogo para eliminar usuario */}
      <DeleteStoreUserDialog
        user={selectedUser}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onUserDeleted={loadStoreUsers}
        onShowToast={(message, type) =>
          type === "success" ? success(message) : showError(message)
        }
      />
    </>
  );
};

export default UsersPage;
