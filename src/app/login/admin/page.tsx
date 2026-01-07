"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginAdmin, obtenerUsuarioActual } from "@/services/auth";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Se necesita un correo electrónico" })
    .email({ message: "Ingresa un correo electrónico válido" })
    .refine((email) => email.trim() === email, {
      message: "El correo no debe contener espacios al inicio o final",
    }),
  password: z.string().min(1, { message: "Ingresa la contraseña" }),
});

type LoginFormType = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toasts, removeToast, success, error: showError } = useToast();

  const loginForm = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const { control, handleSubmit } = loginForm;

  const onSubmit = async (values: LoginFormType) => {
    try {
      const response = await loginAdmin(values);

      if (response.success && response.data) {
        // Guardar token temporalmente para hacer la petición de usuario completo
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
        }

        // Obtener los datos completos del usuario
        const userDataResponse = await obtenerUsuarioActual();

        if (userDataResponse.success && userDataResponse.data) {
          // Guardar usuario COMPLETO y token en el store de autenticación
          login(userDataResponse.data, response.data.token);

          success('Inicio de sesión exitoso');
          router.push('/admin');
        } else {
          // Si falla obtener datos completos, usar los datos básicos del login
          console.warn('No se pudieron obtener datos completos del usuario, usando datos básicos');
          login(response.data.user, response.data.token);
          router.push('/admin');
        }
      } else {
        const errorMessage = response.message || response.error || 'Error en el inicio de sesión';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.toLowerCase().includes('credenciales')) {
          showError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        } else if (error.message.includes('404')) {
          showError('Usuario no encontrado. Por favor, verifica tu email.');
        } else {
          showError('Error en el inicio de sesión. Por favor, inténtalo de nuevo.');
        }
      } else {
        showError('Error en el inicio de sesión. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="flex w-full min-h-screen flex-col justify-center items-center px-4 py-8 sm:py-10">
      <h1 className="text-secondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-center mb-6 sm:mb-8">
        Admin - Inicia sesión
      </h1>
      <div className="w-full max-w-md p-4 sm:p-8 flex justify-center">
        <Form {...loginForm}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
            <div className="space-y-4 sm:space-y-6">
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Correo electrónico:</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Contraseña:</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full flex flex-col justify-center content-center items-center gap-4 pt-4">
              <Button
                type="submit"
                className="font-medium rounded-md px-6 py-2 h-fit text-base sm:text-lg md:text-xl w-full sm:w-auto sm:min-w-[200px]"
              >
                Inicia sesión
              </Button>
            </div>
          </form>
        </Form>

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
    </div>
  );
}
