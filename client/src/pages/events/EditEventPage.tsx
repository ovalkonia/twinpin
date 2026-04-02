import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { getEventById, updateEvent, type Event } from '../../services/events';
import '../../styles/create-event.css';

function toDatetimeLocalValue(iso?: string) {
    if (!iso) return '';
    // Use ISO -> YYYY-MM-DDTHH:mm (UTC). This is good enough for editing; backend stores ISO.
    return new Date(iso).toISOString().slice(0, 16);
}

export const EditEventPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<Event | null>(null);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tagsStr, setTagsStr] = useState('');
    const [location, setLocation] = useState('');
    const [dateLocal, setDateLocal] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getEventById(id)
            .then((evt) => {
                setEvent(evt);
                setTitle(evt.title);
                setDescription(evt.description);
                setCategory(evt.category);
                setTagsStr((evt.tags ?? []).join(', '));
                setLocation(evt.location ?? '');
                setDateLocal(toDatetimeLocalValue(evt.date));
            })
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id]);

    const tags = useMemo(() => {
        const raw = tagsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        // De-dupe while preserving order.
        const seen = new Set<string>();
        const out: string[] = [];
        for (const t of raw) {
            const key = t.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(t);
        }
        return out;
    }, [tagsStr]);

    const handleSave = async () => {
        if (!event) return;
        if (!title.trim()) {
            toast.error('Event title is required');
            return;
        }
        if (!category.trim()) {
            toast.error('Category is required');
            return;
        }
        if (!dateLocal) {
            toast.error('Event date is required');
            return;
        }

        setSaving(true);
        try {
            const dateIso = new Date(dateLocal).toISOString();
            await updateEvent(event.id, {
                title,
                description,
                category,
                tags,
                location: location || undefined,
                date: dateIso,
            });
            toast.success('Event updated');
            navigate(`/events/${event.id}`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="ev-page">
                <Header />
                <div className="ev-container">
                    <p>Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="ev-page">
                <Header />
                <div className="ev-container">
                    <p>Event not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ev-page">
            <Header />
            <div className="ev-container">
                <h1 className="ev-heading">Edit Event</h1>

                <div className="ev-card">
                    <div className="cr-field">
                        <label className="cr-label">Title</label>
                        <input className="cr-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Description</label>
                        <textarea
                            className="cr-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Category</label>
                        <input className="cr-input" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Tags (comma separated)</label>
                        <input className="cr-input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Location</label>
                        <input className="cr-input" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Event date</label>
                        <input
                            type="datetime-local"
                            className="cr-input"
                            value={dateLocal}
                            onChange={(e) => setDateLocal(e.target.value)}
                        />
                    </div>

                    <div className="cr-nav">
                        <div className="cr-nav-spacer" />
                        <button type="button" className="cr-btn cr-btn--ghost" onClick={() => navigate(`/events/${event.id}`)}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="cr-btn cr-btn--primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

