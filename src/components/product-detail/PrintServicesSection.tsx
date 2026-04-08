"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { PRINT_SERVICES } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";

interface PrintServicesSectionProps {
  data?: ProductPageSectionComplete | null;
}

export default function PrintServicesSection({ data }: PrintServicesSectionProps) {
  const titulo = data?.section.titulo ?? "Nuestros Servicios de Impresión";
  const subtitulo = data?.section.subtitulo ?? "Ofrecemos una variedad de productos para que tus recuerdos cobren vida.";

  const services = data?.slides?.length
    ? data.slides
        .filter(s => s.activo)
        .sort((a, b) => a.orden - b.orden)
        .map(s => ({
          title: s.titulo || '',
          description: s.descripcion || '',
          image: s.imagenUrl || '/slide1.jpg',
        }))
    : PRINT_SERVICES;

  return (
    <section className="py-16">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
