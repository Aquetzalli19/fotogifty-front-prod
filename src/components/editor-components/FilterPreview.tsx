import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface FilterPreviewProps {
  imageSrc: string;
  selectedFilter: string;
  onFilterSelect: (filter: string) => void;
  filters: Array<{ id: string; name: string; className?: string }>;
}

const FilterPreview: React.FC<FilterPreviewProps> = ({
  imageSrc,
  selectedFilter,
  onFilterSelect,
  filters,
}) => {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (!imageSrc) return;

    filters.forEach((filter) => {
      const canvas = canvasRefs.current[filter.id];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imageSrc;

      img.onload = () => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image with filter
        switch (filter.id) {
          case "none":
            ctx.filter = "none";
            break;
          case "blackwhite":
          case "grayscale":
            ctx.filter = "grayscale(100%)";
            break;
          case "sepia":
            ctx.filter = "sepia(100%)";
            break;
          default:
            ctx.filter = "none";
        }

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Reset filter
        ctx.filter = "none";
      };
    });
  }, [imageSrc, filters]);

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-sm font-medium">Filtros</h3>
      <div className="flex space-x-2  py-2">
        {filters.map((filter) => (
          <div key={filter.id} className="flex flex-col items-center">
            <Button
              variant={selectedFilter === filter.id ? "secondary" : "outline"}
              size="sm"
              className={`w-16 h-16 rounded-md overflow-hidden p-0  ${
                selectedFilter === filter.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onFilterSelect(filter.id)}
            >
              <div className="w-full h-full bg-cover bg-center relative">
                {imageSrc ? (
                  <canvas
                    ref={(el) => {
                      if (el) {
                        canvasRefs.current[filter.id] = el;
                      } else {
                        delete canvasRefs.current[filter.id];
                      }
                    }}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
            </Button>
            <span className="text-xs mt-1">{filter.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPreview;
