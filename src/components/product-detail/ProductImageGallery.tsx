"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GALLERY_IMAGES } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";

interface ProductImageGalleryProps {
  data?: ProductPageSectionComplete | null;
}

export default function ProductImageGallery({ data }: ProductImageGalleryProps) {
  const titulo = data?.section.titulo ?? "Imprime Tus Mejores Momentos";
  const subtitulo = data?.section.subtitulo ?? "Cada foto cuenta una historia. Nosotros la imprimimos con la calidad que merece.";

  const images = data?.slides?.length
    ? data.slides
        .filter(s => s.activo)
        .sort((a, b) => a.orden - b.orden)
        .map(s => ({
          src: s.imagenUrl || '/slide1.jpg',
          alt: s.titulo || 'Imagen de galería',
          span: s.descripcion || '',
        }))
    : GALLERY_IMAGES;

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {titulo}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            {subtitulo}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-xl bg-muted ${img.span}`}
            >
              <div className="relative aspect-square w-full h-full min-h-[150px]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
