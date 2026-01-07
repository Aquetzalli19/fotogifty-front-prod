/**
 * Página principal de admin
 * Importa el dashboard de pedidos (delivercontrol)
 */
import DeliverControlPage from "./(delivercontrol)/page";

// Force dynamic rendering to avoid Next.js 15 pre-rendering bug
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <DeliverControlPage />;
}
