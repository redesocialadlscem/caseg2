import { Link } from 'react-router-dom';
import { Pin, MessageSquare, Heart, Lock } from 'lucide-react';

interface TopicListItemProps {
  id: number;
  courseId: number;
  title: string;
  authorName: string;
  authorRole: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  likeCount: number;
  createdAt: string;
}

export function TopicListItem({
  id,
  courseId,
  title,
  authorName,
  authorRole,
  isPinned,
  isLocked,
  replyCount,
  likeCount,
  createdAt,
}: TopicListItemProps) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      to={`/forum/${courseId}/topic/${id}`}
      className={`flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-slate-50 ${
        isPinned
          ? 'border-indigo-200 bg-indigo-50/50'
          : 'border-slate-100 bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {isPinned ? <Pin className="h-5 w-5 text-indigo-600" /> : <MessageSquare className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isPinned && (
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Fixado
            </span>
          )}
          {isLocked && <Lock className="h-3.5 w-3.5 text-amber-600" />}
          <h4 className="font-semibold text-slate-900 truncate">{title}</h4>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            por <span className={authorRole === 'admin' ? 'font-semibold text-indigo-600' : 'text-slate-700'}>{authorName}</span>
          </span>
          <span>•</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          <span>{likeCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{replyCount}</span>
        </div>
      </div>
    </Link>
  );
}
