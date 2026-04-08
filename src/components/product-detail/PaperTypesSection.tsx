"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAPER_TYPES } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";

interface PaperTypesSectionProps {
  data?: ProductPageSectionComplete | null;
}

export default function PaperTypesSection({ data }: PaperTypesSectionProps) {
  const titulo = data?.section.titulo ?? "Tipos de Papel";
  const subtitulo = data?.section.subtitulo ?? "Elige el acabado perfecto para cada ocasión. Todos nuestros papeles son de grado profesional.";

  const useCmsData = data?.slides && data.slides.length > 0;

  if (useCmsData) {
    const cmsSlides = data.slides
      .filter(s => s.activo)
      .sort((a, b) => a.orden - b.orden);
    const cmsOptions = data.options?.filter(o => o.activo) || [];

    return (
      <section className="py-16 bg-muted/30">
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

          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue={String(cmsSlides[0]?.id)}>
              <TabsList className={`grid w-full grid-cols-${Math.min(cmsSlides.length, 5)}`}>
                {cmsSlides.map((slide) => (
                  <TabsTrigger key={slide.id} value={String(slide.id)}>
                    {slide.titulo}
                  </TabsTrigger>
                ))}
              </TabsList>

              {cmsSlides.map((slide) => {
                const features = cmsOptions
                  .filter(o => o.slideId === slide.id)
                  .sort((a, b) => a.orden - b.orden);

                return (
                  <TabsContent key={slide.id} value={String(slide.id)} className="mt-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold">{slide.titulo}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {slide.descripcion}
                        </p>
                        {features.length > 0 && (
                          <ul className="space-y-2">
                            {features.map((feature) => (
                              <li key={feature.id} className="flex items-center gap-2">
                                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm">{feature.texto}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {slide.imagenUrl && (
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-lg">
                          <Image
                            src={slide.imagenUrl}
                            alt={`Papel ${slide.titulo}`}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </section>
    );
  }

  // Fallback to static data
  return (
    <section className="py-16 bg-muted/30">
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

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="lustre">
            <TabsList className="grid w-full grid-cols-3">
              {PAPER_TYPES.map((paper) => (
                <TabsTrigger key={paper.id} value={paper.id}>
                  {paper.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {PAPER_TYPES.map((paper) => (
              <TabsContent key={paper.id} value={paper.id} className="mt-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">{paper.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {paper.description}
                    </p>
                    <ul className="space-y-2">
                      {paper.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-lg">
                    <Image
                      src={paper.image}
                      alt={`Papel ${paper.name}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
}
