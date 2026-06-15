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
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
          {category || 'Geral'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-4 text-sm text-slate-500">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span>Acessar Fórum</span>
        </div>
      </div>
    </Link>
  );
}
