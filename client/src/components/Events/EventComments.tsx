import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getEventComments,
    addEventComment,
    deleteEventComment,
    type EventComment,
} from '../../services/events';

interface Props {
    eventId: string;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventComments({ eventId }: Props) {
    const { user, isAuth } = useAuth();
    const [comments, setComments]   = useState<EventComment[]>([]);
    const [body, setBody]           = useState('');
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        getEventComments(eventId)
            .then(setComments)
            .catch(() => {});
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = body.trim();
        if (!trimmed || submitting) return;
        setSubmitting(true);
        try {
            const created = await addEventComment(eventId, trimmed);
            setComments(prev => [created, ...prev]);
            setBody('');
            textareaRef.current?.focus();
        } catch {
            // silent — toast would need import, keep component lean
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteEventComment(eventId, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {}
    };

    return (
        <div className="ev-comments">
            <h3 className="ev-comments-title">Comments</h3>

            {isAuth ? (
                <form className="ev-comment-form" onSubmit={handleSubmit}>
                    <textarea
                        ref={textareaRef}
                        className="ev-comment-input"
                        placeholder="Write a comment…"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={3}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any);
                        }}
                    />
                    <div className="ev-comment-form-footer">
                        <span className="ev-comment-hint">Ctrl+Enter to post</span>
                        <button
                            type="submit"
                            className="ev-comment-submit"
                            disabled={submitting || !body.trim()}
                        >
                            {submitting ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="ev-comment-login-prompt">
                    <Link to="/auth/sign-in">Sign in</Link> to leave a comment.
                </p>
            )}

            {comments.length === 0 ? (
                <p className="ev-comment-empty">No comments yet. Be the first!</p>
            ) : (
                <ul className="ev-comment-list">
                    {comments.map(c => {
                        const initial = c.authorName?.[0]?.toUpperCase() ?? '?';
                        const isOwn   = user?.id === c.authorId;
                        return (
                            <li key={c.id} className="ev-comment-item">
                                <div className="ev-comment-avatar">
                                    {c.authorAvatarUrl
                                        ? <img src={c.authorAvatarUrl} alt={c.authorName} className="ev-comment-avatar-img" />
                                        : initial}
                                </div>
                                <div className="ev-comment-body">
                                    <div className="ev-comment-meta">
                                        <Link to={`/profile/${c.authorId}`} className="ev-comment-author">
                                            {c.authorName}
                                        </Link>
                                        <span className="ev-comment-time">{timeAgo(c.createdAt)}</span>
                                        {isOwn && (
                                            <button
                                                className="ev-comment-delete"
                                                onClick={() => handleDelete(c.id)}
                                                aria-label="Delete comment"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="ev-comment-text">{c.body}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
