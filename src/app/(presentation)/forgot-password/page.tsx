"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Lock, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  VerifyIdentitySchema,
  VerifyIdentitySchemaType,
  ResetPasswordSchema,
  ResetPasswordSchemaType,
} from "@/validations/forgot-password-schema";
import { verificarIdentidad, cambiarPasswordOlvidada } from "@/services/auth";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [verifiedData, setVerifiedData] = useState<{ email: string; countryCode: string; phoneNumber: string } | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Formulario paso 1: Verificar identidad
  const verifyForm = useForm<VerifyIdentitySchemaType>({
    resolver: zodResolver(VerifyIdentitySchema),
    defaultValues: {
      email: "",
      countryCode: "+52",
      phoneNumber: "",
    },
  });

  // Formulario paso 2: Nueva contraseña
  const resetForm = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Paso 1: Verificar email y teléfono
  const onVerifySubmit = async (values: VerifyIdentitySchemaType) => {
    try {
      const response = await verificarIdentidad({
        email: values.email,
        telefono: `${values.countryCode}${values.phoneNumber}`,
      });

      if (response.success) {
        success("Identidad verificada correctamente");
        setVerifiedData(values);
        setStep(2);
      } else {
        showError(response.message || "Los datos no coinciden con nuestros registros");
      }
    } catch (err) {
      console.error("Error al verificar identidad:", err);
      showError("Error al verificar los datos. Por favor, intenta de nuevo.");
    }
  };

  // Paso 2: Cambiar contraseña
  const onResetSubmit = async (values: ResetPasswordSchemaType) => {
    if (!verifiedData) {
      showError("Error: Datos de verificación no encontrados");
      return;
    }

    try {
      const response = await cambiarPasswordOlvidada({
        email: verifiedData.email,
        telefono: `${verifiedData.countryCode}${verifiedData.phoneNumber}`,
        nueva_password: values.newPassword,
      });

      if (response.success) {
        success("¡Contraseña cambiada exitosamente! Redirigiendo al login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        showError(response.message || "Error al cambiar la contraseña");
      }
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      showError("Error al cambiar la contraseña. Por favor, intenta de nuevo.");
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-10rem)] flex-col justify-center items-center px-4 py-8 md:py-12">
      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>

      <h1 className="text-secondary text-3xl md:text-4xl lg:text-5xl font-medium mb-2 text-center">
        Recuperar Contraseña
      </h1>
      <p className="text-muted-foreground text-center mb-6 md:mb-8 max-w-md">
        {step === 1
          ? "Ingresa tu correo y teléfono registrados para verificar tu identidad"
          : "Ingresa tu nueva contraseña"}
      </p>

      {/* Progress Indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
          }`}>
            {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
          </div>
          <div className={`h-1 w-16 ${step >= 2 ? "bg-secondary" : "bg-muted"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg bg-card rounded-xl shadow-lg p-6 md:p-8">
        {step === 1 ? (
          /* Paso 1: Verificar Identidad */
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={verifyForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Correo electrónico</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                      <FormControl>
                        <Input
                          placeholder="usuario@ejemplo.com"
                          type="email"
                          className="h-11 md:h-12 pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono */}
              <FormField
                control={verifyForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Número de teléfono</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        countryCode={verifyForm.watch("countryCode")}
                        onValueChange={field.onChange}
                        onCountryChange={(code) => verifyForm.setValue("countryCode", code)}
                        placeholder="5512345678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 md:h-12 font-medium rounded-lg text-base md:text-lg"
              >
                Verificar Identidad
              </Button>
            </form>
          </Form>
        ) : (
          /* Paso 2: Nueva Contraseña */
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
              {/* Datos verificados (solo lectura) */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{verifiedData?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {verifiedData?.countryCode} {verifiedData?.phoneNumber}
                  </span>
                </div>
              </div>

              {/* Nueva contraseña */}
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Nueva contraseña</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          className="h-11 md:h-12 pl-10"
                          autoComplete="new-password"
                          {...field}
                          onChange={(e) => resetForm.setValue('newPassword', e.target.value, { shouldValidate: true, shouldDirty: true })}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmar contraseña */}
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Confirmar contraseña</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          className="h-11 md:h-12 pl-10"
                          autoComplete="new-password"
                          {...field}
                          onChange={(e) => resetForm.setValue('confirmPassword', e.target.value, { shouldValidate: true, shouldDirty: true })}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setVerifiedData(null);
                    resetForm.reset();
                  }}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 md:h-12 font-medium rounded-lg text-base md:text-lg"
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </form>
          </Form>
        )}
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
