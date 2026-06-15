import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PublicHeader } from '../components/PublicLayout';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';

export function CartPage() {
  const { items, removeItem, clearCart, total, count } = useCart();
  const { isAuthenticated, accessToken } = useAuthContext();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    if (items.length === 0) return;

    setPaying(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseIds: items.map(i => String(i.id)) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao iniciar pagamento');
      }

      const data = await res.json();
      clearCart();
      window.location.href = data.init_point || data.sandbox_init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setPaying(false);
    }
  }

  // Empty cart state
  if (count === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),transparent_28%),linear-gradient(180deg,_#f0fdf4,_#ecfccb)]">
        <PublicHeader />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="max-w-md w-full text-center p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 border-2 border-black rounded-xl shadow-brutal mb-6">
              <ShoppingBag size={40} className="text-brand" strokeWidth={2.5} />
            </div>
            <h1 className="font-display font-bold text-2xl uppercase tracking-tight mb-3">
              Carrinho Vazio
            </h1>
            <p className="font-body text-gray-600 mb-8 leading-relaxed">
              Você ainda não adicionou nenhum curso ao carrinho. Explore nossos cursos e encontre o ideal para você!
            </p>
            <Link to="/#cursos">
              <Button variant="primary" className="w-full justify-center">
                <ArrowLeft size={18} className="mr-2" />
                Explorar Cursos
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),transparent_28%),linear-gradient(180deg,_#f0fdf4,_#ecfccb)]">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-8">
          <Link to="/" className="hover:text-brand transition-colors">Início</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Carrinho</span>
        </nav>

        <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight mb-8">
          Seu Carrinho ({count} {count === 1 ? 'curso' : 'cursos'})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-black rounded-xl shadow-brutal p-4 sm:p-6 flex gap-4 sm:gap-6 items-start"
              >
                {/* Image */}
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 border-2 border-black rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={24} className="text-brand opacity-40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg uppercase tracking-tight truncate">
                    {item.title}
                  </h3>
                  <p className="font-body text-brand font-bold text-lg mt-1">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 p-2 border-2 border-black rounded-lg hover:bg-red-50 active:translate-y-[2px] transition-all"
                  title="Remover do carrinho"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight mb-6">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-gray-600">Subtotal ({count} {count === 1 ? 'curso' : 'cursos'})</span>
                  <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t-2 border-dashed border-black/20 pt-3 flex justify-between">
                  <span className="font-display font-bold text-lg uppercase">Total</span>
                  <span className="font-display font-bold text-2xl text-brand">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-600 rounded-lg">
                  <p className="font-body text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center mb-3"
                onClick={handleCheckout}
                disabled={paying}
              >
                {paying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </span>
                ) : (
                  'Pagar com Mercado Pago'
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-xs text-center font-bold uppercase text-gray-500 mb-3">
                  Login necessário para pagar
                </p>
              )}

              <Link to="/#cursos">
                <button className="w-full flex items-center justify-center gap-2 font-body font-medium text-sm text-gray-500 hover:text-brand transition-colors py-2">
                  <ArrowLeft size={16} />
                  Continuar comprando
                </button>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
