"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCT_TYPES } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";

interface ProductTypesShowcaseProps {
  data?: ProductPageSectionComplete | null;
}

interface ProductTypeCard {
  title: string;
  description: string;
  image: string;
  linkHref: string | null;
}

export default function ProductTypesShowcase({ data }: ProductTypesShowcaseProps) {
  const titulo = data?.section.titulo ?? "Nuestros Productos";
  const subtitulo = data?.section.subtitulo ?? "Tres estilos únicos para dar vida a tus fotos favoritas.";

  const types: ProductTypeCard[] = data?.slides?.length
    ? data.slides
        .filter(s => s.activo)
        .sort((a, b) => a.orden - b.orden)
        .map(s => ({
          title: s.titulo || '',
          description: s.descripcion || '',
          image: s.imagenUrl || '/slide1.jpg',
          linkHref: s.paqueteLinkId ? `/user/product/${s.paqueteLinkId}` : null,
        }))
    : PRODUCT_TYPES.map(t => ({ ...t, linkHref: null }));

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {types.map((type, i) => {
            const cardContent = (
              <>
                <Image
                  src={type.image}
                  alt={type.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                  <p className="text-sm text-white/80">{type.description}</p>
                </div>
              </>
            );

            const className = `group relative aspect-[3/4] rounded-2xl overflow-hidden block ${
              type.linkHref ? 'cursor-pointer' : ''
            }`;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                {type.linkHref ? (
                  <Link href={type.linkHref} className={className}>
                    {cardContent}
                  </Link>
                ) : (
                  <div className={className}>{cardContent}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
