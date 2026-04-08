"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ProductPageSectionKey,
  PRODUCT_PAGE_SECTION_METADATA,
} from "@/interfaces/product-page-content";
import {
  Edit,
  Copy,
  Undo2,
} from "lucide-react";
import Link from "next/link";

interface PerProductSectionCardProps {
  sectionKey: ProductPageSectionKey;
  hasOverride: boolean;
  paqueteId: number;
  onClone: (sectionKey: ProductPageSectionKey) => Promise<void>;
  onRevert: (sectionKey: ProductPageSectionKey) => Promise<void>;
  isLoading?: boolean;
}

export function PerProductSectionCard({
  sectionKey,
  hasOverride,
  paqueteId,
  onClone,
  onRevert,
  isLoading,
}: PerProductSectionCardProps) {
  const metadata = PRODUCT_PAGE_SECTION_METADATA[sectionKey];

  return (
    <Card className="relative overflow-hidden transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{metadata.name}</h3>
          <Badge
            variant={hasOverride ? "default" : "secondary"}
            className={
              hasOverride
                ? "bg-green-600 dark:bg-green-700 shrink-0"
                : "bg-gray-500 dark:bg-gray-600 shrink-0"
            }
          >
            {hasOverride ? "Personalizado" : "Global (heredado)"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {metadata.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {hasOverride ? (
            <>
              <Link href={`/admin/itemcontrol/${paqueteId}/page-content/${sectionKey}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={isLoading}>
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => onRevert(sectionKey)}
                disabled={isLoading}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Revertir a Global
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => onClone(sectionKey)}
                disabled={isLoading}
              >
                <Copy className="h-3.5 w-3.5" />
                Clonar desde Global
              </Button>
              <Link href={`/admin/itemcontrol/${paqueteId}/page-content/${sectionKey}`}>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" disabled={isLoading}>
                  <Edit className="h-3.5 w-3.5" />
                  Crear Personalizado
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
