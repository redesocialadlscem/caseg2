import { Link } from 'react-router-dom';
import { MessageSquare, BookOpen } from 'lucide-react';

interface ForumCourseCardProps {
  id: number;
  title: string;
  imageUrl: string;
  category: string;
}

export function ForumCourseCard({ id, title, imageUrl, category }: ForumCourseCardProps) {
  return (
    <Link
      to={`/forum/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-brutal brutal-interactive"
    >
      <div className="relative h-40 w-full overflow-hidden border-b-2 border-black bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <BookOpen className="h-12 w-12" strokeWidth={2.5} />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-lg border-2 border-black bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-brutal-sm">
          {category || 'Geral'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold uppercase leading-tight text-black line-clamp-2">
          {title}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold uppercase tracking-wide text-brand">
          <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
          <span>Acessar Fórum</span>
        </div>
      </div>
    </Link>
  );
}
