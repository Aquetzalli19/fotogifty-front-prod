"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  crearSocialLink,
  actualizarSocialLink,
  eliminarSocialLink,
  reordenarSocialLinks,
} from "@/services/footer-config";
import type { SocialLink, SocialPlatform } from "@/interfaces/footer-config";

interface SocialLinksManagerProps {
  socialLinks: SocialLink[];
  onLinksUpdated: (links: SocialLink[]) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const platformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

export function SocialLinksManager({ socialLinks, onLinksUpdated, onSuccess, onError }: SocialLinksManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform | "">("");
  const [newUrl, setNewUrl] = useState("");
  const [editingUrls, setEditingUrls] = useState<Record<number, string>>({});

  // Plataformas disponibles (que aún no están en uso)
  const availablePlatforms = (Object.keys(platformLabels) as SocialPlatform[]).filter(
    (platform) => !socialLinks.some((link) => link.plataforma === platform)
  );

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl.trim()) {
      onError("Por favor completa todos los campos");
      return;
    }

    try {
      const newLink = await crearSocialLink({
        plataforma: newPlatform,
        url: newUrl.trim(),
        orden: socialLinks.length,
        activo: true,
      });

      onLinksUpdated([...socialLinks, newLink]);
      setNewPlatform("");
      setNewUrl("");
      setIsAdding(false);
      onSuccess("Red social agregada exitosamente");
    } catch (err) {
      console.onError("Error adding social link:", err);
      onError("Error al agregar la red social");
    }
  };

  const handleUpdateLink = async (id: number, updates: Partial<SocialLink>) => {
    try {
      const updatedLink = await actualizarSocialLink(id, updates);
      onLinksUpdated(
        socialLinks.map((link) => (link.id === id ? { ...link, ...updatedLink } : link))
      );
      onSuccess("✅ Cambios guardados");
    } catch (err) {
      console.onError("Error updating social link:", err);
      onError("Error al guardar los cambios");
    }
  };

  // Maneja el cambio de URL en el input (solo estado local)
  const handleUrlChange = (id: number, url: string) => {
    setEditingUrls((prev) => ({ ...prev, [id]: url }));
  };

  // Guarda la URL cuando el usuario sale del input
  const handleUrlBlur = async (id: number) => {
    const newUrl = editingUrls[id];
    if (newUrl !== undefined) {
      const currentLink = socialLinks.find((l) => l.id === id);
      if (currentLink && newUrl !== currentLink.url) {
        try {
          const updatedLink = await actualizarSocialLink(id, { url: newUrl });
          onLinksUpdated(
            socialLinks.map((link) => (link.id === id ? { ...link, ...updatedLink } : link))
          );
          onSuccess("✅ Cambios guardados");
        } catch (err) {
          console.onError("Error updating social link:", err);
          onError("Error al guardar los cambios");
        }
      }
      // Limpiar el estado de edición
      setEditingUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeleteLink = async (id: number) => {
    try {
      await eliminarSocialLink(id);
      const newLinks = socialLinks.filter((link) => link.id !== id);
      // Reordenar después de eliminar
      const reorderedLinks = newLinks.map((link, index) => ({
        ...link,
        orden: index,
      }));
      onLinksUpdated(reorderedLinks);
      // Actualizar orden en el backend - asegurar que los IDs sean números
      const ids = reorderedLinks.map((l) => Number(l.id));
      await reordenarSocialLinks(ids);
      onSuccess("Red social eliminada");
    } catch (err) {
      console.onError("Error deleting social link:", err);
      onError("Error al eliminar la red social");
    }
  };

  const handleMoveLink = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= socialLinks.length) return;

    const newLinks = [...socialLinks];
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];

    // Actualizar orden
    const reorderedLinks = newLinks.map((link, idx) => ({
      ...link,
      orden: idx,
    }));

    onLinksUpdated(reorderedLinks);

    try {
      // Asegurar que los IDs sean números, no strings
      const ids = reorderedLinks.map((l) => Number(l.id));
      await reordenarSocialLinks(ids);
      onSuccess("✅ Orden actualizado");
    } catch (err) {
      console.onError("Error reordering links:", err);
      onError("Error al reordenar");
      // Revertir en caso de onError
      onLinksUpdated(socialLinks);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociales</CardTitle>
        <CardDescription>
          Gestiona los enlaces a redes sociales que aparecen en el footer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de enlaces existentes */}
        {socialLinks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No hay redes sociales configuradas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {socialLinks
              .sort((a, b) => a.orden - b.orden)
              .map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-card"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Plataforma</Label>
                      <p className="font-medium">{platformLabels[link.plataforma]}</p>
                    </div>
                    <div className="sm:col-span-1">
                      <Label htmlFor={`url-${link.id}`} className="text-xs">
                        URL
                      </Label>
                      <Input
                        id={`url-${link.id}`}
                        value={editingUrls[link.id] ?? link.url}
                        onChange={(e) => handleUrlChange(link.id, e.target.value)}
                        onBlur={() => handleUrlBlur(link.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // Trigger blur to save
                          }
                        }}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveLink(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveLink(index, "down")}
                        disabled={index === socialLinks.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.activo}
                        onCheckedChange={(checked) =>
                          handleUpdateLink(link.id, { activo: checked })
                        }
                      />
                      <Label className="text-xs text-muted-foreground">
                        {link.activo ? "Activo" : "Inactivo"}
                      </Label>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Formulario para agregar nuevo */}
        {isAdding ? (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-platform">Plataforma</Label>
                <Select
                  value={newPlatform}
                  onValueChange={(value) => setNewPlatform(value as SocialPlatform)}
                >
                  <SelectTrigger id="new-platform">
                    <SelectValue placeholder="Selecciona una plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platformLabels[platform]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-url">URL</Label>
                <Input
                  id="new-url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewPlatform("");
                  setNewUrl("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddLink}>Agregar</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full gap-2"
            disabled={availablePlatforms.length === 0}
          >
            <Plus className="h-4 w-4" />
            {availablePlatforms.length === 0
              ? "Todas las plataformas agregadas"
              : "Agregar Red Social"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
