import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import Image from "next/image";

interface DownloadPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onDownload: () => void;
  imageDimensions: { width: number; height: number };
  category?: string;
}

const DownloadPreview: React.FC<DownloadPreviewProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onDownload,
  imageDimensions,
  category = "default", // Default to a standard preview
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [calendarImage, setCalendarImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && imageSrc) {
      setIsLoading(true);

      const img = new window.Image();
      img.onload = () => {
        setPreviewImage(imageSrc);

        if (category === "Calendario") {
          const calendarImg = new window.Image();
          calendarImg.onload = () => {
            setCalendarImage("/Calendar.png");
            setIsLoading(false);
          };
          calendarImg.onerror = () => {
            setIsLoading(false);
          };
          calendarImg.src = "/Calendar.png";
        } else {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        setIsLoading(false);
      };
      img.src = imageSrc;
    } else if (!isOpen) {
      setPreviewImage(null);
      setCalendarImage(null);
      setIsLoading(true);
    }
  }, [isOpen, imageSrc, category]);

  if (!isOpen) return null;

  const renderPreview = () => {
    if (category === "Polaroid") {
      return (
        <div className="relative border-8 border-white rounded-md overflow-hidden shadow-lg max-w-full max-h-[65vh] bg-white">
          {previewImage && (
            <Image
              src={previewImage}
              alt="Vista previa de la imagen editada"
              width={imageDimensions.width}
              height={imageDimensions.height}
              className="object-contain max-h-[55vh] p-4"
              style={{ width: "auto", height: "auto" }}
              unoptimized={true}
            />
          )}
          <div className="min-h-22 bg-white"></div>{" "}
        </div>
      );
    } else if (category === "Calendario" && calendarImage && previewImage) {
      return (
        <div className="relative max-w-full max-h-[60vh] overflow-hidden ">
          {/* Calendar background */}
          <Image
            src={calendarImage}
            alt="Plantilla de calendario"
            width={imageDimensions.width}
            height={imageDimensions.height}
            className="object-contain max-h-[60vh]"
            style={{ width: "auto", height: "auto" }}
            unoptimized={true}
          />
          {/* Overlay with user image */}
          <div className="absolute  flex items-center justify-center top-6 -right-7  md:-right-17 min-h-32  min-w-104">
            <Image
              src={previewImage}
              alt=""
              width={imageDimensions.width}
              height={imageDimensions.height / 2}
              className="md:object-contain md:max-h-[40vh] md:max-w-[70%] max-w-[80%] min-h-[30vh]"
              style={{ width: "auto", height: "auto" }}
              unoptimized={true}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative border border-gray-300 rounded-md overflow-hidden max-w-full max-h-[60vh]">
          {previewImage && (
            <Image
              src={previewImage}
              alt="Vista previa de la imagen editada"
              width={imageDimensions.width}
              height={imageDimensions.height}
              className="object-contain max-h-[60vh]"
              style={{ width: "auto", height: "auto" }}
              unoptimized={true}
            />
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Previsualización de descarga</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {renderPreview()}
              <div className="text-sm text-gray-500">
                Dimensiones: {imageDimensions.width} x {imageDimensions.height}{" "}
                px
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Cancelar
            </Button>
            <Button
              onClick={onDownload}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download size={16} />
              Descargar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadPreview;
