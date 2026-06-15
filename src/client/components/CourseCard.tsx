import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Clock, ChevronRight, BookOpen, ShoppingCart, PlayCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';

interface CourseCardProps {
  id: string | number;
  title: string;
  description?: string;
  category?: string;
  durationHours?: number;
  price?: string;
  priceValue?: number;
  imageColor?: string;
  imageUrl?: string;
  progress?: number; // 0-100, undefined = not started
  totalModules?: number;
  completedModules?: number;
  onClick?: () => void;
}

export const CourseCard = memo(function CourseCard({
  id,
  title,
  description,
  category,
  durationHours,
  price,
  priceValue,
  imageColor,
  imageUrl,
  progress = 0,
  totalModules,
  completedModules,
  onClick,
}: CourseCardProps) {
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const { isAuthenticated } = useAuthContext();
  const isCompleted = progress >= 100;
  const inCart = typeof id === 'number' && isInCart(id);

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    if (typeof id === 'number' && priceValue != null) {
      addItem({ id, title, price: priceValue, imageUrl: imageUrl || '' });
    }
  }

  function handleEnroll(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    navigate(`/courses/${id}/player`);
  }

  return (
    <Card
      className="group flex flex-col h-full brutal-interactive cursor-pointer border-2 border-black bg-white shadow-brutal"
      onClick={onClick}
    >
      {(imageUrl || imageColor) ? (
        <div className={`relative aspect-video ${!imageUrl && imageColor ? imageColor : 'bg-gray-100'} border-b-2 border-black flex items-center justify-center overflow-hidden`}>
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <BookOpen size={48} className="text-black opacity-20" />
          )}
          <div className="absolute top-3 left-3">
            {category && (
              <Badge variant="neutral">{category}</Badge>
            )}
          </div>
        </div>
      ) : (
        category && (
          <div className="mb-4">
            <Badge variant="neutral">{category}</Badge>
          </div>
        )
      )}

      {/* Title & Description */}
      <div className="flex-1 mb-4">
        <h3 className="font-display font-bold text-lg sm:text-xl uppercase leading-tight group-hover:text-brand transition-colors">
          {title}
        </h3>
        {description && (
          <p className="font-body text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 mb-4 text-xs font-body text-gray-500">
        {durationHours != null && durationHours > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} strokeWidth={2.5} />
            <span className="font-medium">{durationHours}h</span>
          </div>
        )}
        {totalModules != null && (
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} strokeWidth={2.5} />
            <span className="font-medium">
              {completedModules ?? 0}/{totalModules} módulos
            </span>
          </div>
        )}
      </div>

      {/* Progress or Status */}
      <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-200">
        <div className="flex items-center justify-between gap-4">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-brand font-display font-bold text-sm uppercase">
              <div className="w-5 h-5 bg-brand border-2 border-black flex items-center justify-center">
                <ChevronRight size={14} className="text-white rotate-[-45deg] translate-y-[-1px]" strokeWidth={3} />
              </div>
              Concluído
            </div>
          ) : (
            <ProgressBar value={progress} size="sm" />
          )}
          {price && <span className="font-display font-bold text-lg text-brand">{price}</span>}
        </div>
        
        {/* Action Buttons */}
        {!isCompleted && (
          <div className="mt-4">
            {priceValue != null && priceValue > 0 ? (
              <Button
                variant={inCart ? "outline" : "primary"}
                size="sm"
                className="w-full"
                onClick={handleAddToCart}
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} strokeWidth={2.5} />
                  {inCart ? 'No Carrinho' : 'Adicionar ao Carrinho'}
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleEnroll}
              >
                <span className="flex items-center justify-center gap-2">
                  <PlayCircle size={16} strokeWidth={2.5} />
                  Matricular-se Agora
                </span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});
