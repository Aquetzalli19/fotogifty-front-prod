"use client";

import React, { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { itemPackages } from "@/interfaces/admi-items";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Trash2, ImageIcon } from "lucide-react";
import EditItemDialog from "./EditItemDialog";
import Image from "next/image";

interface ItemCardProps {
  item: itemPackages;
  onDelete: (item: itemPackages) => void;
  onUpdate: () => void;
}

const ItemCard = ({ item, onDelete, onUpdate }: ItemCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEditSuccess = () => {
    setIsDialogOpen(false);
    onUpdate();
  };

  return (
    <>
      <Card className="mx-2 sm:mx-0">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4 p-3 sm:p-6">
          {/* Imagen del paquete */}
          {item.imagen_url ? (
            <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border bg-muted shrink-0">
              <Image
                src={item.imagen_url}
                alt={item.packageName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border bg-muted shrink-0 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Información del paquete */}
          <div className="flex-1 w-full">
            <div className="flex flex-row justify-between items-start gap-2">
              <CardTitle className="text-base sm:text-lg">{item.packageName}</CardTitle>
              <Badge
                variant={item.itemStatus ? "secondary" : "outline"}
                className="text-xs sm:text-sm shrink-0"
              >
                {item.itemStatus ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm sm:text-base text-muted-foreground">
              <p className="font-medium text-secondary text-xs sm:text-sm">
                {item.productClasification}
              </p>
              <p className="text-xs sm:text-sm">Cantidad de fotos: {item.photoQuantity}</p>
              <p className="text-xs sm:text-sm line-clamp-2">{item.description}</p>
              <p className="text-dark font-semibold text-sm sm:text-base">
                Precio: {""}
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(item.packagePrice)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="w-full justify-end flex flex-col sm:flex-row px-3 sm:px-4 pb-3 sm:pb-4 gap-2">
          <Button
            variant="destructive"
            onClick={() => onDelete(item)}
            className="text-sm sm:text-base gap-2 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
          <Button
            variant="default"
            onClick={() => setIsDialogOpen(true)}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            Editar producto
          </Button>
        </CardFooter>
      </Card>
      <EditItemDialog
        open={isDialogOpen}
        item={item}
        setClose={handleEditSuccess}
      />
    </>
  );
};

export default ItemCard;
