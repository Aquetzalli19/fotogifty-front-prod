---
name: fix-build
description: Ejecuta npm run build y corrige todos los errores y warnings de ESLint/TypeScript hasta que el build compile limpio.
---

# Fix Build Errors & Warnings

Ejecuta `npm run build 2>&1` y corrige **todos** los errores y warnings que aparezcan en la salida. No pares hasta que el build compile sin ningún error ni warning de ESLint/TypeScript.

## Reglas de corrección

### Errores TypeScript (bloquean el build — prioridad máxima)
- Corrige el tipo directamente en el código. Usa casteos (`as`) solo si no hay alternativa limpia.
- Typos como `console.onError` → `console.error` corrígelos de inmediato.

### `@typescript-eslint/no-unused-vars`
- **Imports no usados**: elimina solo el identificador específico de la lista de imports.
- **Variables de destructuring no usadas**: elimina solo esa variable del destructuring.
- **Parámetros de función para compatibilidad** (ej. `_quality`): añade `// eslint-disable-line @typescript-eslint/no-unused-vars` al final de esa línea.
- **Catch binding no usado** `catch (_e)`: cámbialo a `catch` (optional catch binding de TypeScript).

### `react-hooks/exhaustive-deps`
El comentario `// eslint-disable-next-line react-hooks/exhaustive-deps` debe ir **DENTRO** del cuerpo del hook, en la línea inmediatamente anterior al cierre `}, [deps]);`.

✅ CORRECTO:
```ts
useEffect(() => {
  hacerAlgo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dep]);
```

❌ INCORRECTO (antes del `useEffect`):
```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  hacerAlgo();
}, [dep]);
```

Para avisos de tipo *"logical expression could make dependencies change on every render"*, envuelve la expresión en su propio `useMemo` en lugar de suprimir el warning.

### `@next/next/no-img-element`
En JSX, añade `{/* eslint-disable-next-line @next/next/no-img-element */}` en la línea anterior al `<img>`. Úsalo solo cuando el `<img>` sea intencional (canvas, manipulación DOM directa).

### Directivas `eslint-disable` huérfanas
Si aparece *"Unused eslint-disable directive"*, significa que el comentario está en la posición incorrecta. Muévelo a la línea inmediatamente anterior a la que genera el warning real.

## Flujo de trabajo

1. Ejecuta `npm run build 2>&1` y captura toda la salida.
2. Agrupa los problemas por archivo.
3. Lee cada archivo afectado antes de editarlo.
4. Aplica las correcciones siguiendo las reglas anteriores.
5. Vuelve a ejecutar `npm run build 2>&1` para verificar.
6. Repite hasta que no quede ningún error ni warning (solo está permitido el warning del sistema `--localstorage-file` que es del entorno, no del código).
