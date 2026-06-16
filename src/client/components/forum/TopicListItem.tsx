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
      className={`flex items-start gap-4 rounded-xl border-2 border-black p-4 shadow-brutal brutal-interactive ${
        isPinned ? 'bg-emerald-50' : 'bg-white'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-brand text-white shadow-brutal-sm">
        {isPinned ? <Pin className="h-5 w-5" strokeWidth={2.5} /> : <MessageSquare className="h-5 w-5" strokeWidth={2.5} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isPinned && (
            <span className="rounded-md border-2 border-black bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-brutal-sm">
              Fixado
            </span>
          )}
          {isLocked && <Lock className="h-3.5 w-3.5 text-red-600" strokeWidth={2.5} />}
          <h4 className="font-display font-bold uppercase text-black truncate">{title}</h4>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span>
            por <span className={authorRole === 'admin' ? 'font-bold text-brand' : 'text-gray-700'}>{authorName}</span>
          </span>
          <span>·</span>
          <span className="uppercase tracking-wide">{date}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-xs font-bold text-gray-600">
        <div className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>{likeCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>{replyCount}</span>
        </div>
      </div>
    </Link>
  );
}
