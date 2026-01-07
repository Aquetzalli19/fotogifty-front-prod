# 📥 Guía de Descarga de Fotos con DPI

Esta guía explica cómo usar el sistema de descarga de fotos con metadatos DPI correctos (300 DPI).

## ⚠️ IMPORTANTE: Permisos de Descarga

**Solo los siguientes roles pueden descargar fotos:**
- ✅ **Admin** (`admin`, `super_admin`)
- ✅ **Store** (personal de ventanilla)
- ❌ **Clientes** (usuarios normales) NO pueden descargar

Los componentes verifican automáticamente el rol del usuario y **no se muestran** si el usuario no tiene permisos.

---

## 🎯 ¿Qué se implementó?

### 1. Servicio de Fotos (`src/services/fotos.ts`)
- `obtenerUrlDescargaFoto(fotoId)`: Obtiene URL firmada de S3
- `descargarFoto(fotoId, nombreArchivo?)`: Descarga una foto directamente
- `descargarMultiplesFotos(fotoIds[])`: Descarga múltiples fotos
- `obtenerMetadataFoto(fotoId)`: Obtiene solo metadata sin descargar

### 2. Componentes Reutilizables
- `DownloadFotoButton`: Botón para descargar una foto individual
- `DownloadPedidoFotos`: Botón para descargar todas las fotos de un pedido

---

## 📖 Ejemplos de Uso

### 1. Descargar una Foto Individual

```tsx
import DownloadFotoButton from "@/components/user/DownloadFotoButton";

// Uso básico
<DownloadFotoButton fotoId={123} />

// Con nombre personalizado
<DownloadFotoButton
  fotoId={123}
  nombreArchivo="mi-foto-impresion.jpg"
/>

// Con metadata visible
<DownloadFotoButton
  fotoId={123}
  showMetadata={true}
  onDownloadComplete={(metadata) => {
    console.log('DPI:', metadata.resolucionDPI);
    console.log('Tamaño:', metadata.anchoFisico, 'x', metadata.altoFisico, 'cm');
  }}
/>

// Variantes de estilo
<DownloadFotoButton
  fotoId={123}
  variant="default"  // o "outline", "ghost", "secondary"
  size="lg"          // o "sm", "default", "icon"
  className="w-full"
/>
```

### 2. Descargar Todas las Fotos de un Pedido

```tsx
import DownloadPedidoFotos from "@/components/user/DownloadPedidoFotos";

// Uso básico
<DownloadPedidoFotos
  fotoIds={[123, 124, 125]}
  pedidoId={456}
/>

// Con nombre del pedido
<DownloadPedidoFotos
  fotoIds={fotosDelPedido.map(f => f.id)}
  pedidoId={pedido.id}
  nombrePedido={`Pedido #${pedido.id}`}
  variant="default"
  size="lg"
/>
```

### 3. Uso Programático (sin componentes)

```tsx
import { descargarFoto, descargarMultiplesFotos, obtenerMetadataFoto } from "@/services/fotos";

// Descargar una foto
const handleDownload = async () => {
  try {
    const result = await descargarFoto(123, "foto-para-imprimir.jpg");
    console.log('Descargado:', result.filename);
    console.log('DPI:', result.metadata.resolucionDPI); // 300
  } catch (error) {
    console.error('Error:', error);
  }
};

// Descargar múltiples fotos
const handleDownloadMultiple = async () => {
  const fotoIds = [123, 124, 125];
  const results = await descargarMultiplesFotos(fotoIds, 500); // 500ms entre descargas

  console.log(`Descargadas: ${results.success}`);
  console.log(`Fallidas: ${results.failed}`);
  if (results.errors.length > 0) {
    console.error('Errores:', results.errors);
  }
};

// Obtener solo metadata
const handleGetMetadata = async () => {
  const metadata = await obtenerMetadataFoto(123);
  if (metadata) {
    console.log('Tamaño físico:', metadata.anchoFisico, 'x', metadata.altoFisico, 'cm');
    console.log('DPI:', metadata.resolucionDPI);
    console.log('Tamaño archivo:', (metadata.tamanioArchivo / 1024 / 1024).toFixed(2), 'MB');
  }
};
```

---

## 🔧 Integración en Páginas Existentes

**IMPORTANTE:** Todos estos ejemplos son para páginas de **Admin** o **Store**, ya que los usuarios normales NO pueden descargar fotos.

### Ejemplo 1: Admin - Vista de Pedidos para Impresión

```tsx
// src/app/admi/(delivercontrol)/page.tsx

import DownloadPedidoFotos from "@/components/user/DownloadPedidoFotos";
import { Download } from "lucide-react";

export default function AdminDeliveryControl() {
  const { pedidos } = useAdminPedidos();

  return (
    <div>
      <h1>Control de Pedidos - Impresión</h1>

      {pedidos.map((pedido) => (
        <div key={pedido.id} className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">Pedido #{pedido.id}</h3>
              <p className="text-sm text-muted-foreground">
                Cliente: {pedido.cliente.nombre}
              </p>
              <p className="text-sm text-muted-foreground">
                {pedido.fotos.length} fotos para imprimir
              </p>
            </div>

            {/* Botón para descargar todas las fotos y enviar a impresión */}
            <DownloadPedidoFotos
              fotoIds={pedido.fotos.map(f => f.id)}
              pedidoId={pedido.id}
              nombrePedido={`Pedido-${pedido.id}`}
              variant="default"
              size="lg"
            />
          </div>

          {/* Información de impresión */}
          <div className="mt-4 p-3 bg-muted rounded">
            <p className="text-xs font-semibold mb-2">📋 Info de Impresión:</p>
            <ul className="text-xs space-y-1">
              {pedido.items.map((item) => (
                <li key={item.id}>
                  • {item.cantidad}x {item.paquete.nombre} ({item.paquete.ancho_cm}×{item.paquete.alto_cm}cm @ 300 DPI)
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Store - Vista de Pedido Individual

```tsx
// src/app/admi/(delivercontrol)/pedidos/[id]/page.tsx

import DownloadFotoButton from "@/components/user/DownloadFotoButton";
import DownloadPedidoFotos from "@/components/user/DownloadPedidoFotos";

export default function StorePedidoDetailPage({ params }: { params: { id: string } }) {
  const { pedido } = usePedido(params.id);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pedido #{pedido.id}</h1>
          <p className="text-muted-foreground">Cliente: {pedido.cliente.nombre}</p>
        </div>

        {/* Descargar todas las fotos del pedido */}
        <DownloadPedidoFotos
          fotoIds={pedido.fotos.map(f => f.id)}
          pedidoId={pedido.id}
          variant="default"
          size="lg"
        />
      </div>

      {/* Galería de fotos con botones individuales */}
      <div className="grid grid-cols-3 gap-4">
        {pedido.fotos.map((foto) => (
          <div key={foto.id} className="border rounded-lg p-4">
            <img
              src={foto.url_thumbnail || foto.url}
              alt={foto.nombre_archivo}
              className="w-full h-40 object-cover rounded mb-3"
            />

            <div className="text-xs text-muted-foreground mb-2">
              <p>📐 {foto.ancho_foto} × {foto.alto_foto} cm</p>
              <p>🖨️ {foto.resolucion_foto} DPI</p>
            </div>

            {/* Botón de descarga individual con metadata */}
            <DownloadFotoButton
              fotoId={foto.id}
              nombreArchivo={foto.nombre_archivo}
              showMetadata={true}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔍 Metadata Incluida en la Descarga

Cada foto descargada incluye metadatos en la respuesta:

```typescript
{
  anchoFisico: 10.16,        // Ancho en cm
  altoFisico: 15.24,         // Alto en cm
  resolucionDPI: 300,        // DPI embebidos (para impresión)
  tamanioArchivo: 2457600    // Tamaño en bytes
}
```

**Los DPI están embebidos en el archivo JPEG/PNG**, por lo que cuando abras la foto en:
- Photoshop
- Lightroom
- Software de impresión
- Sistema de impresora

**Automáticamente detectará 300 DPI** y calculará el tamaño de impresión correcto.

---

## ⚠️ Consideraciones Importantes

### 1. URLs Firmadas de S3
- Las URLs de descarga **expiran en 1 hora**
- Si el usuario intenta usar la URL después de 1 hora, debe solicitar una nueva
- El componente maneja esto automáticamente obteniendo una URL nueva cada vez

### 2. Descargas Múltiples
- Hay un **delay de 500-800ms entre descargas** para evitar saturar el navegador
- El navegador puede mostrar múltiples diálogos de "Guardar como"
- Algunos navegadores limitan descargas simultáneas (Chrome: ~6)

### 3. Permisos (SOLO ADMIN Y STORE)
**IMPORTANTE:** Solo Admin y Store pueden descargar fotos.

El frontend verifica el rol del usuario:
- Si el usuario NO es Admin/Store → **Los botones no se muestran** (return null)
- Los componentes usan `useAuthStore()` para verificar `user.tipo_usuario`

El backend también valida:
- ✅ Administradores (`admin`, `super_admin`)
- ✅ Personal de ventanilla (`store`)
- ❌ Usuarios normales (clientes) NO pueden descargar

Si el usuario no tiene permiso, recibirá error 403.

### 4. Manejo de Errores
Los componentes manejan automáticamente:
- Errores de red
- Errores de permisos
- URLs expiradas
- Archivos no encontrados

Y muestran toasts informativos al usuario.

---

## 📊 Logs de Consola

Al descargar fotos, verás logs útiles:

```
📥 Descargando foto: {
  fotoId: 123,
  filename: 'foto.jpg',
  metadata: {
    anchoFisico: 10.16,
    altoFisico: 15.24,
    resolucionDPI: 300,
    tamanioArchivo: 2457600
  }
}
✅ Foto descargada correctamente con DPI: 300

📥 Descargando 5 fotos del pedido 456...
📊 Resultado de descarga: {
  success: 5,
  failed: 0,
  errors: []
}
```

---

## 🎨 Personalización

### Estilos de los Botones

```tsx
// Botón grande y destacado
<DownloadPedidoFotos
  variant="default"
  size="lg"
  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
/>

// Botón pequeño y discreto
<DownloadFotoButton
  variant="ghost"
  size="sm"
  className="text-xs"
/>

// Solo icono
<DownloadFotoButton
  variant="outline"
  size="icon"
/>
```

### Callbacks Personalizados

```tsx
<DownloadFotoButton
  fotoId={123}
  onDownloadComplete={(metadata) => {
    // Ejecutar lógica personalizada
    analytics.track('foto_descargada', {
      dpi: metadata.resolucionDPI,
      tamano: `${metadata.anchoFisico}x${metadata.altoFisico}`
    });

    // Actualizar estado
    setFotoDescargada(true);

    // Mostrar modal
    setShowSuccessModal(true);
  }}
/>
```

---

## 🚀 Próximos Pasos Sugeridos

1. **Integrar en página de backlog** para que usuarios puedan descargar sus fotos
2. **Integrar en admin** para impresión de pedidos
3. **Agregar vista previa** antes de descargar (modal con la imagen)
4. **Descarga en ZIP** (múltiples fotos en un solo archivo)
5. **Historial de descargas** (tracking en BD)

---

## 📚 Referencias

- [PRINT_QUALITY_GUIDE.md](./PRINT_QUALITY_GUIDE.md) - Guía de calidad de impresión
- [DPI_WORKFLOW.md](./DPI_WORKFLOW.md) - Flujo completo de DPI
- [API Backend Docs](http://localhost:3001/api-docs) - Documentación del endpoint

---

**✅ Sistema de descarga implementado y listo para usar**
