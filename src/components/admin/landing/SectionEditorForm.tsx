"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ImageUploader } from "./ImageUploader";
import { ColorPickerField } from "./ColorPickerField";
import {
  LandingSection,
  LandingSectionDTO,
  SECTION_METADATA,
  SectionKey,
  CarouselConfig,
} from "@/interfaces/landing-content";

interface SectionEditorFormProps {
  sectionKey: SectionKey;
  values: LandingSectionDTO;
  onChange: (values: LandingSectionDTO) => void;
  disabled?: boolean;
  onUploadMainImage?: (file: File) => Promise<string>;
  onUploadBackgroundImage?: (file: File) => Promise<string>;
}

export function SectionEditorForm({
  sectionKey,
  values,
  onChange,
  disabled = false,
  onUploadMainImage,
  onUploadBackgroundImage,
}: SectionEditorFormProps) {
  const metadata = SECTION_METADATA[sectionKey];
  const editableFields = metadata.editableFields;

  const updateField = <K extends keyof LandingSectionDTO>(
    field: K,
    value: LandingSectionDTO[K]
  ) => {
    onChange({ ...values, [field]: value });
  };

  const updateCarouselConfig = (key: keyof CarouselConfig, value: boolean | number) => {
    const currentConfig = values.configuracionExtra || {
      autoplay: true,
      autoplaySpeed: 3000,
      transitionSpeed: 500,
      infinite: true,
    };
    onChange({
      ...values,
      configuracionExtra: {
        ...currentConfig,
        [key]: value,
      },
    });
  };

  // Character limits for text fields
  const CHAR_LIMITS: Record<string, number> = {
    titulo: 100,
    subtitulo: 150,
    descripcion: 200,
    textoPrimario: 150,
    textoSecundario: 200,
    botonTexto: 50,
    botonEnlace: 255,
  };

  const CharCounter = ({ value, max }: { value: string; max: number }) => (
    <p className={`text-xs text-right ${value.length > max * 0.9 ? "text-amber-500" : "text-muted-foreground"}`}>
      {value.length}/{max}
    </p>
  );

  const renderField = (field: keyof LandingSection) => {
    switch (field) {
      case "titulo":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={values.titulo || ""}
              onChange={(e) => updateField("titulo", e.target.value || null)}
              placeholder="Título de la sección"
              disabled={disabled}
              maxLength={CHAR_LIMITS.titulo}
            />
            <CharCounter value={values.titulo || ""} max={CHAR_LIMITS.titulo} />
          </div>
        );

      case "subtitulo":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="subtitulo">Subtítulo</Label>
            <Textarea
              id="subtitulo"
              value={values.subtitulo || ""}
              onChange={(e) => updateField("subtitulo", e.target.value || null)}
              placeholder="Subtítulo de la sección"
              disabled={disabled}
              maxLength={CHAR_LIMITS.subtitulo}
              rows={2}
            />
            <CharCounter value={values.subtitulo || ""} max={CHAR_LIMITS.subtitulo} />
          </div>
        );

      case "descripcion":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={values.descripcion || ""}
              onChange={(e) => updateField("descripcion", e.target.value || null)}
              placeholder="Descripción detallada"
              disabled={disabled}
              maxLength={CHAR_LIMITS.descripcion}
              rows={3}
            />
            <CharCounter value={values.descripcion || ""} max={CHAR_LIMITS.descripcion} />
          </div>
        );

      case "textoPrimario":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="textoPrimario">Texto Primario</Label>
            <Textarea
              id="textoPrimario"
              value={values.textoPrimario || ""}
              onChange={(e) => updateField("textoPrimario", e.target.value || null)}
              placeholder="Texto principal"
              disabled={disabled}
              maxLength={CHAR_LIMITS.textoPrimario}
              rows={2}
            />
            <CharCounter value={values.textoPrimario || ""} max={CHAR_LIMITS.textoPrimario} />
          </div>
        );

      case "textoSecundario":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="textoSecundario">Texto Secundario</Label>
            <Textarea
              id="textoSecundario"
              value={values.textoSecundario || ""}
              onChange={(e) => updateField("textoSecundario", e.target.value || null)}
              placeholder="Texto secundario"
              disabled={disabled}
              maxLength={CHAR_LIMITS.textoSecundario}
              rows={2}
            />
            <CharCounter value={values.textoSecundario || ""} max={CHAR_LIMITS.textoSecundario} />
          </div>
        );

      case "colorPrimario":
        return (
          <ColorPickerField
            key={field}
            value={values.colorPrimario || null}
            onChange={(color) => updateField("colorPrimario", color)}
            label="Color Primario"
            disabled={disabled}
          />
        );

      case "colorSecundario":
        return (
          <ColorPickerField
            key={field}
            value={values.colorSecundario || null}
            onChange={(color) => updateField("colorSecundario", color)}
            label="Color Secundario"
            disabled={disabled}
          />
        );

      case "colorGradienteInicio":
        return (
          <ColorPickerField
            key={field}
            value={values.colorGradienteInicio || null}
            onChange={(color) => updateField("colorGradienteInicio", color)}
            label="Gradiente - Inicio"
            disabled={disabled}
            allowAlpha
          />
        );

      case "colorGradienteMedio":
        return (
          <ColorPickerField
            key={field}
            value={values.colorGradienteMedio || null}
            onChange={(color) => updateField("colorGradienteMedio", color)}
            label="Gradiente - Medio"
            disabled={disabled}
            allowAlpha
          />
        );

      case "colorGradienteFin":
        return (
          <ColorPickerField
            key={field}
            value={values.colorGradienteFin || null}
            onChange={(color) => updateField("colorGradienteFin", color)}
            label="Gradiente - Fin"
            disabled={disabled}
            allowAlpha
          />
        );

      case "imagenPrincipalUrl":
        return (
          <ImageUploader
            key={field}
            value={values.imagenPrincipalUrl || null}
            onChange={(url) => updateField("imagenPrincipalUrl", url)}
            label="Imagen Principal"
            disabled={disabled}
            onUpload={onUploadMainImage}
          />
        );

      case "imagenFondoUrl":
        return (
          <ImageUploader
            key={field}
            value={values.imagenFondoUrl || null}
            onChange={(url) => updateField("imagenFondoUrl", url)}
            label="Imagen de Fondo"
            disabled={disabled}
            onUpload={onUploadBackgroundImage}
          />
        );

      case "botonTexto":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="botonTexto">Texto del Botón</Label>
            <Input
              id="botonTexto"
              value={values.botonTexto || ""}
              onChange={(e) => updateField("botonTexto", e.target.value || null)}
              placeholder="Ordenar"
              disabled={disabled}
              maxLength={CHAR_LIMITS.botonTexto}
            />
            <CharCounter value={values.botonTexto || ""} max={CHAR_LIMITS.botonTexto} />
          </div>
        );

      case "botonColor":
        return (
          <ColorPickerField
            key={field}
            value={values.botonColor || null}
            onChange={(color) => updateField("botonColor", color)}
            label="Color del Botón"
            disabled={disabled}
          />
        );

      case "botonEnlace":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="botonEnlace">Enlace del Botón</Label>
            <Input
              id="botonEnlace"
              value={values.botonEnlace || ""}
              onChange={(e) => updateField("botonEnlace", e.target.value || null)}
              placeholder="/login"
              disabled={disabled}
              maxLength={CHAR_LIMITS.botonEnlace}
            />
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                URL relativa (ej: /login) o absoluta (ej: https://...)
              </p>
              <CharCounter value={values.botonEnlace || ""} max={CHAR_LIMITS.botonEnlace} />
            </div>
          </div>
        );

      case "configuracionExtra":
        const config = values.configuracionExtra || {
          autoplay: true,
          autoplaySpeed: 3000,
          transitionSpeed: 500,
          infinite: true,
        };
        return (
          <Card key={field}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuración del Carrusel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoplay">Autoplay</Label>
                <Switch
                  id="autoplay"
                  checked={config.autoplay}
                  onCheckedChange={(checked) => updateCarouselConfig("autoplay", checked)}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="infinite">Loop Infinito</Label>
                <Switch
                  id="infinite"
                  checked={config.infinite}
                  onCheckedChange={(checked) => updateCarouselConfig("infinite", checked)}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Velocidad Autoplay</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.autoplaySpeed}ms
                  </span>
                </div>
                <Slider
                  value={[config.autoplaySpeed]}
                  onValueChange={([value]) => updateCarouselConfig("autoplaySpeed", value)}
                  min={1000}
                  max={10000}
                  step={500}
                  disabled={disabled || !config.autoplay}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Velocidad Transición</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.transitionSpeed}ms
                  </span>
                </div>
                <Slider
                  value={[config.transitionSpeed]}
                  onValueChange={([value]) => updateCarouselConfig("transitionSpeed", value)}
                  min={100}
                  max={5000}
                  step={100}
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Group fields by type for better organization
  const textFields = editableFields.filter((f) =>
    ["titulo", "subtitulo", "descripcion", "textoPrimario", "textoSecundario"].includes(f)
  );
  const colorFields = editableFields.filter((f) =>
    [
      "colorPrimario",
      "colorSecundario",
      "colorGradienteInicio",
      "colorGradienteMedio",
      "colorGradienteFin",
    ].includes(f)
  );
  const imageFields = editableFields.filter((f) =>
    ["imagenPrincipalUrl", "imagenFondoUrl"].includes(f)
  );
  const buttonFields = editableFields.filter((f) =>
    ["botonTexto", "botonEnlace"].includes(f)
  );
  const hasCarouselConfig = editableFields.includes("configuracionExtra");

  return (
    <div className="space-y-6">
      {/* Text Fields */}
      {textFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contenido de Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {textFields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      )}

      {/* Image Fields */}
      {imageFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Imágenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageFields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      )}

      {/* Color Fields */}
      {colorFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Colores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {colorFields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      )}

      {/* Button Fields */}
      {buttonFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Botón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {buttonFields.map((field) => renderField(field))}
            {editableFields.includes("botonColor") && renderField("botonColor")}
          </CardContent>
        </Card>
      )}

      {/* Carousel Config */}
      {hasCarouselConfig && renderField("configuracionExtra")}
    </div>
  );
}
