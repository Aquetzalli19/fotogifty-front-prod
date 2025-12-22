// src/app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-3xl font-bold text-destructive mb-4">Acceso Denegado</h1>
        <p className="text-lg text-muted-foreground mb-6">
          No tienes permiso para acceder a esta página. Por favor, inicia sesión con una cuenta autorizada.
        </p>
        <a 
          href="/login" 
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Iniciar Sesión
        </a>
      </div>
    </div>
  );
}