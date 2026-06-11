import { memo } from 'react';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';

interface CourseCardProps {
  id: string | number;
  title: string;
  description?: string;
  category?: string;
  durationHours?: number;
  price?: string;
  imageColor?: string;
  progress?: number; // 0-100, undefined = not started
  totalModules?: number;
  completedModules?: number;
  onClick?: () => void;
}

export const CourseCard = memo(function CourseCard({
  title,
  description,
  category,
  durationHours,
  price,
  imageColor,
  progress = 0,
  totalModules,
  completedModules,
  onClick,
}: CourseCardProps) {
  const isCompleted = progress >= 100;

  return (
    <Card
      className="group flex flex-col h-full brutal-interactive cursor-pointer border-2 border-black bg-white shadow-brutal"
      onClick={onClick}
    >
      {imageColor ? (
        <div className={`relative aspect-video ${imageColor} border-b-2 border-black flex items-center justify-center overflow-hidden`}>
          <div className="absolute top-3 left-3">
            {category && (
              <Badge variant="neutral">{category}</Badge>
            )}
          </div>
          <BookOpen size={48} className="text-black opacity-20" />
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
      </div>
    </Card>
  );
});
