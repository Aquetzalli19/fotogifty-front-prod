"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserSchema, UserSchemaType } from "@/validations/user-schema";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { obtenerDocumentoLegalActivo } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";

interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    usuario?: {
      id: number;
      nombre: string;
      email: string;
    };
  };
}

export default function RegisterPage() {
  const router = useRouter();

  // Estado para términos activos
  const [activeTerms, setActiveTerms] = useState<LegalDocument | null>(null);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);

  const registerForm = useForm<UserSchemaType>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      countryCode: "+52",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onSubmit",
  });

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  const { control, handleSubmit, setError } = registerForm;

  // Cargar términos activos al montar el componente
  useEffect(() => {
    async function loadActiveTerms() {
      try {
        setIsLoadingTerms(true);
        const response = await obtenerDocumentoLegalActivo('terms');

        if (response.success && response.data) {
          setActiveTerms(response.data);
          console.log('📋 Términos activos cargados:', response.data.version);
        } else {
          console.warn('No se encontraron términos activos');
        }
      } catch (error) {
        console.error('Error cargando términos:', error);
      } finally {
        setIsLoadingTerms(false);
      }
    }

    loadActiveTerms();
  }, []);

  const onSubmit = async (values: UserSchemaType) => {
    try {
      const userData = {
        nombre: values.firstName,
        apellido: values.lastName,
        telefono: `${values.countryCode}${values.phoneNumber}`,
        email: values.email,
        password: values.password,
        acepto_terminos: values.acceptTerms,
      };

      const response = await apiClient.post<RegisterResponse>('/usuarios', userData);

      if (response.success) {
        // ===== REGISTRAR ACEPTACIÓN DE TÉRMINOS (NUEVO) =====
        // NOTA: El backend ya registra automáticamente la aceptación de términos cuando
        // acepto_terminos es true en el POST /api/usuarios, por lo que NO necesitamos
        // hacer una llamada adicional aquí. Solo mostramos log para confirmar.

        if (values.acceptTerms && activeTerms) {
          console.log(`✅ Términos v${activeTerms.version} registrados automáticamente por el backend`);
        }
        // ===== FIN REGISTRO DE TÉRMINOS =====

        success('¡Registro exitoso! Bienvenido a FotoGifty.');
        // Redirigir al usuario a la página de inicio de sesión
        router.push('/login');
      } else {
        // Si la respuesta tiene un mensaje de error, úsalo; de lo contrario, mensaje genérico
        const errorMessage = response.message || response.error || 'Error en el registro';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error en el registro:', error);

      // Manejar diferentes tipos de errores
      if (error instanceof Error) {
        // Verificar si es un error de validación o de red del backend
        if (error.message.includes('409') || error.message.toLowerCase().includes('duplicate')) {
          showError('El correo electrónico ya está registrado. Por favor, intenta con otro.');
        } else if (error.message.includes('400')) {
          showError('Los datos proporcionados no son válidos. Por favor, verifica la información.');
        } else {
          showError('Error en el registro. Por favor, inténtalo de nuevo.');
        }
      } else {
        showError('Error en el registro. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-10rem)] flex-col justify-center items-center px-4 py-8 md:py-12">
      <h1 className="text-secondary text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-center">
        Regístrate
      </h1>

      <div className="w-full max-w-lg bg-card rounded-xl shadow-lg p-6 md:p-8">
        <Form {...registerForm}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre"
                        type="text"
                        className="h-11 md:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Apellido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu apellido"
                        type="text"
                        className="h-11 md:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teléfono y Email */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Teléfono</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        countryCode={registerForm.watch("countryCode")}
                        onValueChange={field.onChange}
                        onCountryChange={(code) => registerForm.setValue("countryCode", code)}
                        placeholder="5512345678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="usuario@ejemplo.com"
                        type="email"
                        className="h-11 md:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        className="h-11 md:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Confirmar contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        className="h-11 md:h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Términos y Condiciones */}
            <FormField
              control={control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="!flex !flex-row !items-start !gap-3 !space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 shrink-0"
                    />
                  </FormControl>
                  <div className="flex-1 space-y-2">
                    <FormLabel className="text-sm font-normal leading-relaxed cursor-pointer">
                      Acepto los{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-secondary underline hover:text-secondary/80 transition-colors"
                      >
                        términos y condiciones
                      </Link>{" "}
                      y el{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-secondary underline hover:text-secondary/80 transition-colors"
                      >
                        aviso de privacidad
                      </Link>
                      {activeTerms && (
                        <span className="text-xs text-muted-foreground ml-1 block mt-1">
                          (Versión de términos: {activeTerms.version})
                        </span>
                      )}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                type="submit"
                className="w-full h-11 md:h-12 font-medium rounded-lg text-base md:text-lg"
              >
                Regístrate
              </Button>

              <p className="text-muted-foreground text-sm md:text-base text-center">
                ¿Ya tienes una cuenta?{" "}
                <a href="/login" className="text-secondary underline hover:text-secondary/80 transition-colors">
                  Inicia sesión
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
