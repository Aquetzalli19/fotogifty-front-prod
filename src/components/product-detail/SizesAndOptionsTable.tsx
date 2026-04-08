"use client";

import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SIZES_TABLE_DATA } from "./product-detail-data";
import { ProductPageSectionComplete } from "@/interfaces/product-page-content";

interface SizesAndOptionsTableProps {
  data?: ProductPageSectionComplete | null;
}

export default function SizesAndOptionsTable({ data }: SizesAndOptionsTableProps) {
  const titulo = data?.section.titulo ?? "Tamaños y Opciones";
  const subtitulo = data?.section.subtitulo ?? "Encuentra el tamaño perfecto para cada momento. Todos con impresión a 300 DPI.";

  const rows = data?.options?.length
    ? data.options
        .filter(o => o.activo)
        .sort((a, b) => a.orden - b.orden)
        .map(o => ({
          size: o.texto,
          dimensions: o.textoSecundario || '',
          resolution: o.textoTerciario || '',
          editor: o.textoCuarto || '',
          priceFrom: o.textoQuinto || '',
        }))
    : SIZES_TABLE_DATA;

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

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border overflow-hidden shadow-sm"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Tamaño</TableHead>
                  <TableHead className="font-semibold">Dimensiones</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">
                    Resolución
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    Tipo de Editor
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Precio Desde
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{row.size}</TableCell>
                    <TableCell>{row.dimensions}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {row.resolution}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.editor}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {row.priceFrom}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
