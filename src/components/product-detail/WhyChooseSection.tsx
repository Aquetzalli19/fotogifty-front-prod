"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { WHY_CHOOSE_ITEMS } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";
import { getIconByName } from "@/lib/icon-catalog";

interface WhyChooseSectionProps {
  data?: ProductPageSectionComplete | null;
}

export default function WhyChooseSection({ data }: WhyChooseSectionProps) {
  const titulo = data?.section.titulo ?? "Por Qué Elegir FotoGifty";
  const subtitulo = data?.section.subtitulo ?? "Nos dedicamos a transformar tus recuerdos digitales en impresiones de la más alta calidad.";

  const useCmsData = data?.slides && data.slides.length > 0;

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {useCmsData
            ? data.slides
                .filter(s => s.activo)
                .sort((a, b) => a.orden - b.orden)
                .map((slide, i) => {
                  const Icon = getIconByName(slide.icono);
                  return (
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                          <div className="p-3 bg-primary/10 rounded-full mb-4">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">
                            {slide.titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {slide.descripcion}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
            : WHY_CHOOSE_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
