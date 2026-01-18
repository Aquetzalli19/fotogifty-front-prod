"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EdtModal {
  title: string;
  content: React.ReactNode | ((props: { closeModal: () => void }) => React.ReactNode);
  trigger: React.ReactNode;
}

export default function EditModal({ title, content, trigger }: EdtModal) {
  const [open, setOpen] = useState(false);

  const closeModal = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Realiza tus cambios y luego presiona el botón de guardar.
          </DialogDescription>
        </DialogHeader>
        {typeof content === 'function' ? content({ closeModal }) : content}
      </DialogContent>
    </Dialog>
  );
}
