"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActiveToggle } from "./ActiveToggle";
import {
  LandingSectionComplete,
  SECTION_METADATA,
  SectionKey,
} from "@/interfaces/landing-content";
import {
  Edit,
  Image as ImageIcon,
  List,
  Sliders,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SectionCardProps {
  sectionData: LandingSectionComplete;
  onToggle: (sectionKey: SectionKey) => Promise<void>;
}

export function SectionCard({ sectionData, onToggle }: SectionCardProps) {
  const { section, slides, options } = sectionData;
  const metadata = SECTION_METADATA[section.sectionKey];

  // Get preview image (first slide or main image or background)
  const previewImage =
    slides[0]?.imagenUrl ||
    section.imagenPrincipalUrl ||
    section.imagenFondoUrl ||
    null;

  const handleToggle = async () => {
    await onToggle(section.sectionKey);
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        section.activo
          ? "border-border"
          : "border-muted bg-muted/30 opacity-75"
      }`}
    >
      {/* Preview Image */}
      <div className="relative h-32 bg-muted overflow-hidden">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={metadata.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay with section info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <Badge
            variant={section.activo ? "default" : "secondary"}
            className={section.activo ? "bg-green-600 dark:bg-green-700" : "bg-gray-500 dark:bg-gray-600"}
          >
            {section.activo ? (
              <>
                <Eye className="h-3 w-3 mr-1" /> Visible
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" /> Oculto
              </>
            )}
          </Badge>
        </div>

        {/* Section name overlay */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-semibold text-lg truncate">
            {metadata.name}
          </h3>
          <p className="text-white/80 text-xs truncate">
            {metadata.description}
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Content info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {section.titulo && (
            <Badge variant="outline" className="text-xs">
              Título: {section.titulo.substring(0, 20)}
              {section.titulo.length > 20 ? "..." : ""}
            </Badge>
          )}
          {metadata.hasSlides && (
            <Badge variant="outline" className="text-xs">
              <Sliders className="h-3 w-3 mr-1" />
              {slides.length} slides
            </Badge>
          )}
          {metadata.hasOptions && (
            <Badge variant="outline" className="text-xs">
              <List className="h-3 w-3 mr-1" />
              {options.length} opciones
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <ActiveToggle isActive={section.activo} onToggle={handleToggle} />

          <Link href={`/admin/landing-content/${section.sectionKey}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
