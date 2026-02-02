"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  List,
} from "lucide-react";
import { LandingOption, SectionKey } from "@/interfaces/landing-content";
import { AddOptionDialog } from "./AddOptionDialog";
import { EditOptionDialog } from "./EditOptionDialog";

interface OptionsManagerProps {
  options: LandingOption[];
  sectionKey: SectionKey;
  onAdd: (texto: string) => Promise<void>;
  onUpdate: (id: number, data: Partial<LandingOption>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (ids: number[]) => Promise<void>;
  disabled?: boolean;
}

export function OptionsManager({
  options,
  sectionKey,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  disabled = false,
}: OptionsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<LandingOption | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const sortedOptions = [...options].sort((a, b) => a.orden - b.orden);

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = sortedOptions.map((o) => o.id);
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    await onReorder(newOrder);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sortedOptions.length - 1) return;
    const newOrder = sortedOptions.map((o) => o.id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await onReorder(newOrder);
  };

  const handleEdit = (option: LandingOption) => {
    setSelectedOption(option);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirmId === id) {
      await onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Reset after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleToggleActive = async (option: LandingOption) => {
    await onUpdate(option.id, { activo: !option.activo });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Opciones de Tamaño</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {options.length} opciones disponibles
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {sortedOptions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <List className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No hay opciones</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar primera opción
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedOptions.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  option.activo ? "bg-background" : "bg-muted/50 opacity-60"
                }`}
              >
                {/* Grip handle */}
                <div className="text-muted-foreground cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order badge */}
                <Badge variant="outline" className="shrink-0">
                  {index + 1}
                </Badge>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      option.activo ? "font-medium" : "text-muted-foreground"
                    } truncate block`}
                  >
                    {option.texto}
                  </span>
                </div>

                {/* Status */}
                {!option.activo && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Oculto
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveUp(index)}
                    disabled={disabled || index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveDown(index)}
                    disabled={disabled || index === sortedOptions.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(option)}
                    disabled={disabled}
                  >
                    {option.activo ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(option)}
                    disabled={disabled}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      deleteConfirmId === option.id
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "text-destructive hover:text-destructive"
                    }`}
                    onClick={() => handleDelete(option.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddOptionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={onAdd}
      />

      <EditOptionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        option={selectedOption}
        onUpdate={onUpdate}
      />
    </Card>
  );
}
