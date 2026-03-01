"use client";

import { useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinksManager } from "./SocialLinksManager";
import { actualizarFooterConfig } from "@/services/footer-config";
import type { FooterConfig, SocialLink } from "@/interfaces/footer-config";

interface FooterEditorProps {
  initialConfig: FooterConfig;
  onConfigUpdated: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function FooterEditor({ initialConfig, onSuccess, onError }: FooterEditorProps) {
  const [descripcion, setDescripcion] = useState(initialConfig.descripcion || "");
  const [email, setEmail] = useState(initialConfig.email || "");
  const [telefono, setTelefono] = useState(initialConfig.telefono || "");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialConfig.socialLinks);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await actualizarFooterConfig({
        descripcion: descripcion.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
      });
      onSuccess("✅ Configuración guardada exitosamente");
      // NO recargar desde el backend - ya tenemos los datos actualizados en el estado local
    } catch (err) {
      console.error("Error saving footer config:", err);
      onError("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Create preview config
  const previewConfig: FooterConfig = {
    id: initialConfig.id,
    descripcion: descripcion.trim() || null,
    email: email.trim() || null,
    telefono: telefono.trim() || null,
    socialLinks: socialLinks,
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descripción de la Marca</CardTitle>
              <CardDescription>
                Tagline o descripción breve que aparece bajo el logo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Ej: Imprime tus recuerdos favoritos"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {descripcion.length}/200 caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <SocialLinksManager
            socialLinks={socialLinks}
            onLinksUpdated={(newLinks) => setSocialLinks(newLinks)}
            onSuccess={onSuccess}
            onError={onError}
          />
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Email y teléfono que aparecen en el footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hola@fotogifty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Ver Preview
            </>
          )}
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <span className="animate-spin">⏳</span>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Preview del Footer */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>
              Así se verá el footer en la landing page (sin datos reales del servidor)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              {/* We can't use the async Footer component directly, so we'll create a simplified preview */}
              <div className="bg-background border-t border-border">
                <div className="max-w-7xl mx-auto px-6 py-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Columna Marca */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-primary">FotoGifty</h3>
                      {previewConfig.descripcion && (
                        <p className="text-sm text-muted-foreground">
                          {previewConfig.descripcion}
                        </p>
                      )}
                      {previewConfig.socialLinks.filter(l => l.activo).length > 0 && (
                        <div className="flex gap-3">
                          {previewConfig.socialLinks
                            .filter(l => l.activo)
                            .sort((a, b) => a.orden - b.orden)
                            .map((link) => (
                              <div
                                key={link.id}
                                className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs"
                              >
                                {link.plataforma.charAt(0).toUpperCase()}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Columna Productos */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Productos</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Prints</li>
                        <li>Calendarios</li>
                        <li>Polaroids</li>
                        <li>Ampliaciones</li>
                      </ul>
                    </div>

                    {/* Columna Legal */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Legal</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Términos y Condiciones</li>
                        <li>Aviso de Privacidad</li>
                      </ul>
                    </div>

                    {/* Columna Contacto */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Contacto</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {previewConfig.email && <li>📧 {previewConfig.email}</li>}
                        {previewConfig.telefono && <li>📞 {previewConfig.telefono}</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <p className="text-center text-sm text-muted-foreground">
                      © {new Date().getFullYear()} FotoGifty · Todos los derechos reservados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
