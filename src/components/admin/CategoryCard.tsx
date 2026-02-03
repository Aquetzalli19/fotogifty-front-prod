"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { Categoria } from "@/services/categories";

interface CategoryCardProps {
  category: Categoria;
  onEdit: (category: Categoria) => void;
  onDelete: (category: Categoria) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{category.nombre}</CardTitle>
            <CardDescription className="mt-1">
              {category.descripcion || "Sin descripción"}
            </CardDescription>
          </div>
          <Badge
            variant={category.activo ? "default" : "secondary"}
            className={category.activo ? "bg-green-500 dark:bg-green-600" : "bg-gray-500 dark:bg-gray-600"}
          >
            {category.activo ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Creada: {formatDate(category.fecha_creacion)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(category)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(category)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
