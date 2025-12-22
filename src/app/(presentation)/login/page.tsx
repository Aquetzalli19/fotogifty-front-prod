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
import { loginCliente } from "@/services/auth";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  type LoginFormType = z.infer<typeof loginSchema>;
  const router = useRouter();
  const { login } = useAuthStore();

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

  // Toast notifications
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
      const credentials = {
        email: values.email,
        password: values.password,
      };

      const response = await loginCliente(credentials);

      if (response.success && response.data) {
        // Guardar usuario y token en el store de autenticación
        login(response.data.user, response.data.token);

        // También guardar en localStorage para persistencia
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
        }

        success('Inicio de sesión exitoso');

        // Redirigir al usuario a la página principal o dashboard
        router.push('/user');
      } else {
        const errorMessage = response.message || response.error || 'Error en el inicio de sesión';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);

      // Manejar diferentes tipos de errores
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
    <div className="flex w-full min-h-[calc(100vh-10rem)] flex-col justify-center items-center px-4 py-8 md:py-12">
      <h1 className="text-secondary text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-center">
        Inicia sesión
      </h1>

      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-6 md:p-8">
        <Form {...loginForm}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo para el Correo electrónico */}
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm md:text-base">Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario@ejemplo.com"
                      className="h-11 md:h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo para la Contraseña */}
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm md:text-base">Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-11 md:h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                type="submit"
                className="w-full h-11 md:h-12 font-medium rounded-lg text-base md:text-lg"
              >
                Inicia sesión
              </Button>

              <p className="text-muted-foreground text-sm md:text-base text-center">
                ¿No tienes una cuenta?{" "}
                <a href="/signup" className="text-secondary underline hover:text-secondary/80 transition-colors">
                  Regístrate
                </a>
              </p>
            </div>
          </form>
        </Form>
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
}
