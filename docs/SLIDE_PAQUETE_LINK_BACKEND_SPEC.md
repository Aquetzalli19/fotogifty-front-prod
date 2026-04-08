# Backend Spec: Enlace de Slide a Paquete (`paquete_link_id`)

## Contexto

En el CMS de contenido de página de producto, la sección `product_types` ("Nuestros Productos") muestra tarjetas con imagen + título + descripción. Queremos que cada tarjeta pueda **enlazar opcionalmente a un paquete específico**, de forma que al hacer clic el usuario sea redirigido a `/user/product/:paqueteId`.

Esto aplica tanto al CMS **global** (`product_page_slides`) como al CMS **per-producto** (`paquete_page_slides`).

El frontend ya está completamente implementado y espera el campo con el nombre exacto **`paquete_link_id`**. Apenas el backend agregue soporte, la funcionalidad queda viva sin más cambios de UI.

---

## 1. Cambios en la base de datos

### Tabla `product_page_slides` (CMS global)

```sql
ALTER TABLE product_page_slides
  ADD COLUMN paquete_link_id INT NULL AFTER icono;

-- Recomendado: FK con ON DELETE SET NULL para que si se borra un paquete,
-- el slide siga existiendo sin enlace roto.
ALTER TABLE product_page_slides
  ADD CONSTRAINT fk_product_page_slides_paquete_link
  FOREIGN KEY (paquete_link_id)
  REFERENCES paquetes_predefinidos(id)
  ON DELETE SET NULL;
```

### Tabla `paquete_page_slides` (CMS per-producto)

```sql
ALTER TABLE paquete_page_slides
  ADD COLUMN paquete_link_id INT NULL AFTER icono;

ALTER TABLE paquete_page_slides
  ADD CONSTRAINT fk_paquete_page_slides_paquete_link
  FOREIGN KEY (paquete_link_id)
  REFERENCES paquetes_predefinidos(id)
  ON DELETE SET NULL;
```

### Notas

- **Nullable**: un slide sin enlace debe tener `paquete_link_id = NULL`.
- El valor apunta a `paquetes_predefinidos.id`.
- No es obligatorio que la FK valide que el paquete exista; si se prefiere, puede omitirse la FK y solo mantener la columna como `INT NULL`. Pero la FK con `ON DELETE SET NULL` es más robusta.

### Prisma schema (si aplica)

```prisma
model product_page_slides {
  // ... campos existentes ...
  icono            String?  @db.VarChar(100)
  paquete_link_id  Int?
  paquete_link     paquetes_predefinidos? @relation("product_page_slide_link", fields: [paquete_link_id], references: [id], onDelete: SetNull)
  orden            Int      @default(0)
  activo           Boolean  @default(true)
  // ...
}

model paquete_page_slides {
  // ... campos existentes ...
  icono            String?  @db.VarChar(100)
  paquete_link_id  Int?
  paquete_link     paquetes_predefinidos? @relation("paquete_page_slide_link", fields: [paquete_link_id], references: [id], onDelete: SetNull)
  orden            Int      @default(0)
  activo           Boolean  @default(true)
  // ...
}
```

En `paquetes_predefinidos` se deben agregar las relaciones inversas correspondientes (pueden llamarse como prefieran):

```prisma
model paquetes_predefinidos {
  // ... campos existentes ...
  product_page_slides_linked  product_page_slides[]  @relation("product_page_slide_link")
  paquete_page_slides_linked  paquete_page_slides[]  @relation("paquete_page_slide_link")
}
```

---

## 2. Cambios en los endpoints

El frontend envía y recibe el campo como `paquete_link_id` (snake_case) en todos los endpoints relacionados con slides.

### 2.1 `POST /api/product-page/slides` (CMS global — crear slide)

**Request body** — aceptar `paquete_link_id` opcional:

```json
{
  "section_key": "product_types",
  "tipo": "product_type",
  "titulo": "Impresiones Estándar",
  "descripcion": "Disponibles en múltiples tamaños...",
  "imagen_url": "https://...",
  "icono": null,
  "paquete_link_id": 11,
  "orden": 1
}
```

**Response** — incluir `paquete_link_id` en el slide devuelto:

```json
{
  "success": true,
  "data": {
    "id": 42,
    "section_key": "product_types",
    "tipo": "product_type",
    "titulo": "Impresiones Estándar",
    "descripcion": "...",
    "imagen_url": "...",
    "icono": null,
    "paquete_link_id": 11,
    "orden": 1,
    "activo": true,
    "created_at": "2026-04-07T...",
    "updated_at": "2026-04-07T..."
  }
}
```

### 2.2 `PUT /api/product-page/slides/:id` (CMS global — actualizar slide)

**Request body** — aceptar `paquete_link_id` opcional. Un valor de `null` debe **quitar** el enlace.

```json
{
  "titulo": "Impresiones Estándar",
  "paquete_link_id": 11     // número = enlazar, null = quitar enlace, omitir = no tocar
}
```

**Comportamiento esperado:**
- `paquete_link_id: 11` → guardar `11`
- `paquete_link_id: null` → guardar `NULL`
- `paquete_link_id` **omitido del body** → **no modificar** (comportamiento PATCH)

**Response:** igual que en POST, debe incluir el campo actualizado.

### 2.3 `GET /api/product-page/sections`, `GET /api/product-page/sections/:key`, `GET /api/product-page/merged`

Todos los endpoints GET que devuelvan slides deben incluir `paquete_link_id` en cada slide. Ejemplo:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_key": "product_types",
      "slides": [
        {
          "id": 42,
          "tipo": "product_type",
          "titulo": "Impresiones Estándar",
          "imagen_url": "...",
          "icono": null,
          "paquete_link_id": 11,
          "orden": 1,
          "activo": true
        }
      ]
    }
  ]
}
```

### 2.4 `POST /api/paquetes/:paqueteId/page-content/slides` (CMS per-producto — crear)

Exactamente el mismo contrato que 2.1 pero en la tabla `paquete_page_slides`.

### 2.5 `PUT /api/paquetes/:paqueteId/page-content/slides/:id` (CMS per-producto — actualizar)

Exactamente el mismo contrato que 2.2.

### 2.6 `GET /api/paquetes/:paqueteId/page-content/sections`, `GET .../sections/:key`, `GET .../merged`

Igual que 2.3 pero para la tabla per-producto. Incluir `paquete_link_id` en cada slide del response.

---

## 3. Clonar desde global (crítico)

El endpoint de clone debe **copiar el campo `paquete_link_id`** junto con los demás campos:

### `POST /api/paquetes/:paqueteId/page-content/clone-from-global`

Al clonar una sección desde el CMS global al CMS per-producto, para cada slide global se crea un slide nuevo en `paquete_page_slides` con todos los campos copiados, incluyendo `paquete_link_id`.

**Pseudocódigo:**

```ts
for (const globalSlide of globalSlides) {
  await paquetePageSlides.create({
    paquete_id: paqueteId,
    section_key: globalSlide.section_key,
    tipo: globalSlide.tipo,
    titulo: globalSlide.titulo,
    descripcion: globalSlide.descripcion,
    imagen_url: globalSlide.imagen_url,
    icono: globalSlide.icono,
    paquete_link_id: globalSlide.paquete_link_id,  // ← importante
    orden: globalSlide.orden,
    activo: globalSlide.activo,
  });
}
```

---

## 4. Validación

- `paquete_link_id` es opcional. No es requerido por ningún slide.
- Si se envía un valor, debe ser un entero positivo o `null`.
- **No** es obligatorio validar que el ID exista en `paquetes_predefinidos` antes de guardar (la FK con `ON DELETE SET NULL` lo maneja elegantemente si se borra el paquete después).
- Si prefieren validar: devolver `400` con `{ success: false, message: "Paquete no existe" }` cuando `paquete_link_id` apunta a un ID inexistente.

---

## 5. Checklist de implementación

### Backend

- [ ] Migration SQL en `product_page_slides` — agregar columna `paquete_link_id INT NULL`
- [ ] Migration SQL en `paquete_page_slides` — agregar columna `paquete_link_id INT NULL`
- [ ] (Opcional) FK con `ON DELETE SET NULL` en ambas tablas
- [ ] Prisma schema: agregar campo y relación en ambos modelos
- [ ] Prisma schema: agregar relaciones inversas en `paquetes_predefinidos`
- [ ] Regenerar cliente Prisma (`npx prisma generate`)
- [ ] `POST /api/product-page/slides` → aceptar y persistir `paquete_link_id`
- [ ] `PUT /api/product-page/slides/:id` → aceptar, persistir, permitir `null` para quitar
- [ ] `GET` endpoints de global (`/sections`, `/sections/:key`, `/merged`) → incluir campo en response
- [ ] `POST /api/paquetes/:id/page-content/slides` → mismo contrato
- [ ] `PUT /api/paquetes/:id/page-content/slides/:id` → mismo contrato
- [ ] `GET` endpoints per-producto (`/sections`, `/sections/:key`, `/merged`) → incluir campo en response
- [ ] Endpoint de clone (`POST /api/paquetes/:id/page-content/clone-from-global`) → copiar `paquete_link_id`

### Verificación manual

- [ ] Crear un slide con `paquete_link_id: 11` → verificar que se guarda en DB
- [ ] Obtener el slide con GET → verificar que el campo aparece en el response
- [ ] Actualizar con `paquete_link_id: null` → verificar que se borra el enlace en DB
- [ ] Actualizar sin enviar el campo → verificar que el valor existente no cambia
- [ ] Borrar el paquete referenciado → verificar que el slide queda con `paquete_link_id = NULL`
- [ ] Clonar una sección `product_types` desde global a un paquete → verificar que los slides clonados preservan el enlace

---

## 6. Lado del frontend (ya implementado)

Una vez el backend entregue los cambios, **no hay nada más que hacer en frontend**. Los archivos ya listos son:

- `src/interfaces/product-page-content.ts` — campo `paqueteLinkId?: number | null` en interfaces y DTOs
- `src/lib/mappers/product-page-mapper.ts` — mapea `paquete_link_id` ↔ `paqueteLinkId`
- `src/components/admin/product-page/PackageSelector.tsx` — dropdown con búsqueda para elegir paquete
- `src/components/admin/product-page/ProductPageSectionEditor.tsx` — muestra el selector automáticamente en slides `product_type`
- `src/components/product-detail/ProductTypesShowcase.tsx` — envuelve la tarjeta en `<Link href="/user/product/:id">` cuando `paqueteLinkId` tiene valor

---

## 7. Convención de naming

| Frontend (camelCase) | Backend/DB (snake_case) |
|---|---|
| `paqueteLinkId`      | `paquete_link_id`       |

El mapper del frontend (`src/lib/mappers/product-page-mapper.ts`) se encarga de la conversión en ambas direcciones, así que el backend solo debe respetar el nombre en snake_case.
