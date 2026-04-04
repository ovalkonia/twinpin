import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    getEventById,
    getEventTickets,
    updateEvent,
    updateTicketTier,
    createTicketTier,
    type Event,
    type TicketTier,
} from '../../services/events';
import {
    createPromoCode,
    deletePromoCode,
    getPromoCodesForEvent,
    type PromoCode,
} from '../../services/promo-codes';
import {
    IconCamera,
    IconClose,
    IconGlobe,
    IconMapPin,
    IconPlus,
} from '../../assets/icons';
import '../../styles/company-register.css';
import '../../styles/create-event.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDateParts(iso?: string): { date: string; time: string } {
    if (!iso) return { date: '', time: '' };
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const time = d.toISOString().slice(11, 16);
    return { date, time };
}

function isVideoUrl(url: string) {
    return url.includes('/video/upload/') || /\.(mp4|mov|webm|ogg)$/i.test(url);
}

function isValidUrl(s: string) {
    try { new URL(s); return true; } catch { return false; }
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
    title: string;
    description: string;
    format: 'online' | 'offline';
    tags: string[];
    startDate: string;
    startTime: string;
    publishDate: string;
    publishTime: string;
    address: string;
    lat: number | null;
    lng: number | null;
    price: number;
    currency: string;
    capacity: number | null;
    redirectUrl: string;
    attendeeVisibility: 'everyone' | 'attendees';
    organizerNotifications: boolean;
    status: 'draft' | 'published' | 'cancelled';
}

interface GalleryItem { url: string; isVideo: boolean; }
interface PromoInput { code: string; discount: number; discountType: 'percentage' | 'fixed'; maxUses: string; }
interface TierEdit { id: string; name: string; capacity: string; saving: boolean; }
interface NewTierForm { name: string; price: string; currency: string; capacity: string; }

// ─── Component ────────────────────────────────────────────────────────────────

export const EditEventPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<Event | null>(null);
    const [saving, setSaving] = useState(false);
    const [statusChanging, setStatusChanging] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const [form, setForm] = useState<FormState>({
        title: '', description: '', format: 'offline',
        tags: [], startDate: '', startTime: '',
        publishDate: '', publishTime: '',
        address: '', lat: null, lng: null,
        price: 0, currency: 'EUR', capacity: null,
        redirectUrl: '', attendeeVisibility: 'everyone',
        organizerNotifications: true, status: 'draft',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'tags', string>>>({});

    // Cover
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Gallery
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [newGalleryItems, setNewGalleryItems] = useState<GalleryItem[]>([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Address autocomplete
    const addressInputRef = useRef<HTMLInputElement>(null);

    // Promo codes
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [promoInput, setPromoInput] = useState<PromoInput>({
        code: '', discount: 10, discountType: 'percentage', maxUses: '',
    });
    const [promoAdding, setPromoAdding] = useState(false);

    // Ticket tiers
    const [tiers, setTiers] = useState<TicketTier[]>([]);
    const [tierEdits, setTierEdits] = useState<TierEdit[]>([]);
    const [newTierForm, setNewTierForm] = useState<NewTierForm>({ name: '', price: '', currency: 'EUR', capacity: '' });
    const [addingTier, setAddingTier] = useState(false);

    // ── Load event ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        Promise.all([
            getEventById(id),
            getPromoCodesForEvent(id).catch(() => []),
            getEventTickets(id).catch(() => []),
        ]).then(([evt, codes, ticketTiers]) => {
            setEvent(evt);
            setPromoCodes(codes);
            setTiers(ticketTiers);
            setTierEdits(ticketTiers.map(t => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity != null ? String(t.capacity) : '',
                saving: false,
            })));

            const { date: sd, time: st } = isoToDateParts(evt.date);
            const { date: pd, time: pt } = isoToDateParts((evt as any).publishAt);

            setForm({
                title: evt.title,
                description: evt.description,
                format: evt.format,
                tags: [...(evt.tags ?? [])],
                startDate: sd,
                startTime: st,
                publishDate: pd,
                publishTime: pt,
                address: evt.location ?? '',
                lat: evt.lat ?? null,
                lng: evt.lng ?? null,
                price: evt.price ?? 0,
                currency: evt.currency ?? 'EUR',
                capacity: evt.capacity ?? null,
                redirectUrl: (evt as any).redirectAfterPurchase ?? '',
                attendeeVisibility:
                    (evt as any).visitorListPrivacy === 'attendees' ? 'attendees' : 'everyone',
                organizerNotifications: (evt as any).notifyOnNewVisitor ?? true,
                status: evt.status,
            });

            setCoverPreview(evt.coverUrl ?? null);
            setExistingPhotos(evt.photos ?? []);
        })
        .catch(() => toast.error('Failed to load event'))
        .finally(() => setLoading(false));
    }, [id]);

    // ── Google Maps autocomplete ────────────────────────────────────────────

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
        if (!apiKey || apiKey === 'your_google_maps_api_key') return;
        const existing = document.getElementById('gm-places-script') as HTMLScriptElement | null;
        if (existing) {
            if ((window as any).google) {
                initAutocomplete();
            } else {
                existing.addEventListener('load', initAutocomplete);
            }
            return;
        }
        const script = document.createElement('script');
        script.id = 'gm-places-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initAutocomplete() {
        if (!addressInputRef.current || !(window as any).google) return;
        const ac = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['geocode', 'establishment'],
        });
        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place.formatted_address ?? place.name ?? '';
            const lat = place.geometry?.location?.lat() ?? null;
            const lng = place.geometry?.location?.lng() ?? null;
            setForm(f => ({ ...f, address: addr, lat, lng }));
            setErrors(e => ({ ...e, address: undefined }));
        });
    }

    // ── Cleanup ─────────────────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
            newGalleryItems.forEach(i => URL.revokeObjectURL(i.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Field helpers ────────────────────────────────────────────────────────

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => ({ ...e, [key]: undefined }));
    }

    function addTag(raw: string) {
        const trimmed = raw.trim();
        if (!trimmed) return;
        setForm(f => {
            if (f.tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) return f;
            return { ...f, tags: [...f.tags, trimmed] };
        });
        setErrors(e => ({ ...e, tags: undefined }));
    }

    function removeTag(tag: string) {
        setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
    }

    // ── Cover ────────────────────────────────────────────────────────────────

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    }

    // ── Gallery ──────────────────────────────────────────────────────────────

    function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const items: GalleryItem[] = files.map(f => ({
            url: URL.createObjectURL(f),
            isVideo: f.type.startsWith('video/'),
        }));
        setNewGalleryFiles(prev => [...prev, ...files]);
        setNewGalleryItems(prev => [...prev, ...items]);
        e.target.value = '';
    }

    function removeNewGalleryItem(idx: number) {
        URL.revokeObjectURL(newGalleryItems[idx].url);
        setNewGalleryFiles(prev => prev.filter((_, i) => i !== idx));
        setNewGalleryItems(prev => prev.filter((_, i) => i !== idx));
    }

    // ── Promo codes ──────────────────────────────────────────────────────────

    async function handleAddPromo() {
        if (!id || !promoInput.code.trim()) return;
        setPromoAdding(true);
        try {
            const created = await createPromoCode(id, {
                code: promoInput.code.trim().toUpperCase(),
                discount: promoInput.discount,
                discountType: promoInput.discountType,
                maxUses: promoInput.maxUses ? parseInt(promoInput.maxUses) : undefined,
            });
            setPromoCodes(prev => [...prev, created]);
            setPromoInput({ code: '', discount: 10, discountType: 'percentage', maxUses: '' });
        } catch {
            toast.error('Failed to add promo code');
        } finally {
            setPromoAdding(false);
        }
    }

    // ── Tier editing ─────────────────────────────────────────────────────────

    function setTierEdit(tierId: string, patch: Partial<Omit<TierEdit, 'id'>>) {
        setTierEdits(prev => prev.map(t => t.id === tierId ? { ...t, ...patch } : t));
    }

    async function handleSaveTier(tierId: string) {
        if (!id) return;
        const edit = tierEdits.find(t => t.id === tierId);
        if (!edit) return;
        setTierEdit(tierId, { saving: true });
        try {
            const updated = await updateTicketTier(id, tierId, {
                name: edit.name,
                capacity: edit.capacity ? parseInt(edit.capacity) : null,
            });
            setTiers(prev => prev.map(t => t.id === tierId ? updated : t));
            toast.success('Ticket updated');
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to update ticket');
        } finally {
            setTierEdit(tierId, { saving: false });
        }
    }

    async function handleAddTier() {
        if (!id || !newTierForm.name.trim()) return;
        setAddingTier(true);
        try {
            const created = await createTicketTier(id, {
                name: newTierForm.name.trim(),
                price: parseFloat(newTierForm.price) || 0,
                currency: newTierForm.currency,
                capacity: newTierForm.capacity ? parseInt(newTierForm.capacity) : null,
            });
            setTiers(prev => [...prev, created]);
            setTierEdits(prev => [...prev, {
                id: created.id,
                name: created.name,
                capacity: created.capacity != null ? String(created.capacity) : '',
                saving: false,
            }]);
            setNewTierForm({ name: '', price: '', currency: form.currency, capacity: '' });
            toast.success('Ticket tier added');
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to add ticket tier');
        } finally {
            setAddingTier(false);
        }
    }

    async function handleDeletePromo(promoId: string) {
        if (!id) return;
        try {
            await deletePromoCode(id, promoId);
            setPromoCodes(prev => prev.filter(p => p.id !== promoId));
        } catch {
            toast.error('Failed to delete promo code');
        }
    }

    // ── Validation ───────────────────────────────────────────────────────────

    function validate(): boolean {
        const e: typeof errors = {};
        if (!form.title.trim()) e.title = 'Title is required.';
        if (form.tags.length === 0) e.tags = 'At least one tag is required.';
        if (form.tags.length > 0 && form.tags[0].length > 120) e.tags = 'First tag must be ≤ 120 characters.';
        if (!form.description.trim()) e.description = 'Description is required.';
        if (!form.startDate) e.startDate = 'Start date is required.';
        if (!form.startTime) e.startTime = 'Start time is required.';
        if (form.redirectUrl && !isValidUrl(form.redirectUrl)) e.redirectUrl = 'Enter a valid URL.';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    async function handleSave() {
        if (!event || !validate()) return;
        setSaving(true);
        try {
            const start = new Date(`${form.startDate}T${form.startTime}:00`);
            const publishAt = form.publishDate
                ? new Date(`${form.publishDate}T${form.publishTime || '00:00'}:00`)
                : null;

            await updateEvent(event.id, {
                title: form.title,
                description: form.description,
                format: form.format,
                category: form.tags[0] ?? event.category,
                tags: form.tags,
                date: start.toISOString(),
                location: form.address || undefined,
                lat: form.lat ?? undefined,
                lng: form.lng ?? undefined,
                price: form.price,
                currency: form.currency,
                capacity: form.capacity ?? undefined,
                redirectAfterPurchase: form.redirectUrl || undefined,
                visitorListPrivacy: form.attendeeVisibility === 'everyone' ? 'everybody' : 'attendees',
                notifyOnNewVisitor: form.organizerNotifications,
                publishAt: publishAt ? publishAt.toISOString() : undefined,
                cover: coverFile ?? undefined,
                photos: newGalleryFiles.length ? newGalleryFiles : undefined,
            });

            toast.success('Event saved');
            navigate(`/events/${event.id}`);
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to save event');
        } finally {
            setSaving(false);
        }
    }

    // ── Status toggle ────────────────────────────────────────────────────────

    async function handleToggleStatus() {
        if (!event) return;
        const next = event.status === 'published' ? 'draft' : 'published';
        const label = next === 'published' ? 'Publish' : 'Unpublish';
        if (!window.confirm(`${label} this event?`)) return;
        setStatusChanging(true);
        try {
            await updateEvent(event.id, { status: next });
            setEvent(ev => ev ? { ...ev, status: next } : ev);
            setForm(f => ({ ...f, status: next }));
            toast.success(next === 'published' ? 'Event published' : 'Event unpublished');
        } catch {
            toast.error('Failed to update status');
        } finally {
            setStatusChanging(false);
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="ev-page">
                <Header />
                <div className="ev-container" style={{ paddingTop: 'calc(64px + 60px)' }}>
                    <p style={{ color: '#555' }}>Loading event…</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="ev-page">
                <Header />
                <div className="ev-container" style={{ paddingTop: 'calc(64px + 60px)' }}>
                    <p style={{ color: '#555' }}>Event not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ev-page">
            <Header />
            <div className="ev-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <h1 className="ev-heading" style={{ margin: 0 }}>Edit Event</h1>
                    <Link
                        to={`/events/${event.id}`}
                        style={{ marginLeft: 'auto', fontSize: 13, color: '#555', textDecoration: 'none' }}
                    >
                        ← View event
                    </Link>
                </div>

                <div className="ev-card">

                    {/* ── Basic Info ─────────────────────────────────────── */}
                    <div className="cr-section-divider">Basic Info</div>

                    <div className="cr-field">
                        <label className="cr-label">Event Name <span className="cr-required">*</span></label>
                        <input
                            className={`cr-input${errors.title ? ' cr-input--error' : ''}`}
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                        />
                        {errors.title && <span className="cr-error">{errors.title}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Format</label>
                        <div className="ev-segmented">
                            <button
                                type="button"
                                className={`ev-segmented-btn${form.format === 'offline' ? ' ev-segmented-btn--active' : ''}`}
                                onClick={() => set('format', 'offline')}
                            >
                                In-person
                            </button>
                            <button
                                type="button"
                                className={`ev-segmented-btn${form.format === 'online' ? ' ev-segmented-btn--active' : ''}`}
                                onClick={() => set('format', 'online')}
                            >
                                Online
                            </button>
                        </div>
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Category / Tags <span className="cr-required">*</span></label>
                        {form.tags.length > 0 && (
                            <div className="cr-chips ev-tag-list">
                                {form.tags.map(t => (
                                    <span key={t} className="cr-chip cr-chip--selected ev-tag">
                                        {t}
                                        <button
                                            type="button"
                                            className="ev-tag-remove"
                                            onClick={() => removeTag(t)}
                                            aria-label={`Remove ${t}`}
                                        >
                                            <IconClose size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <input
                            className={`cr-input${errors.tags ? ' cr-input--error' : ''}`}
                            placeholder="e.g. Music, Tech, Outdoor…"
                            value={tagInput}
                            onChange={e => {
                                const val = e.target.value;
                                if (val.endsWith(',')) { addTag(val.slice(0, -1)); setTagInput(''); }
                                else setTagInput(val);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); }
                            }}
                        />
                        {errors.tags && <span className="cr-error">{errors.tags}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Description <span className="cr-required">*</span></label>
                        <textarea
                            className={`cr-textarea${errors.description ? ' cr-input--error' : ''}`}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={6}
                        />
                        {errors.description && <span className="cr-error">{errors.description}</span>}
                    </div>

                    {/* ── Schedule ───────────────────────────────────────── */}
                    <div className="cr-section-divider">Schedule</div>

                    <div className="ev-datetime-row">
                        <div className="cr-field" style={{ margin: 0 }}>
                            <label className="cr-label">Start Date <span className="cr-required">*</span></label>
                            <input
                                type="date"
                                className={`cr-input${errors.startDate ? ' cr-input--error' : ''}`}
                                value={form.startDate}
                                onChange={e => set('startDate', e.target.value)}
                            />
                            {errors.startDate && <span className="cr-error">{errors.startDate}</span>}
                        </div>
                        <div className="cr-field" style={{ margin: 0 }}>
                            <label className="cr-label">Start Time <span className="cr-required">*</span></label>
                            <input
                                type="time"
                                className={`cr-input${errors.startTime ? ' cr-input--error' : ''}`}
                                value={form.startTime}
                                onChange={e => set('startTime', e.target.value)}
                            />
                            {errors.startTime && <span className="cr-error">{errors.startTime}</span>}
                        </div>
                    </div>

                    <div className="cr-field" style={{ marginTop: 16, marginBottom: 4 }}>
                        <label className="cr-label">
                            Publish Date
                            <span style={{ color: '#555', fontWeight: 400 }}> — when this event goes live</span>
                        </label>
                    </div>
                    <div className="ev-datetime-row">
                        <div className="cr-field" style={{ margin: 0 }}>
                            <input
                                type="date"
                                className="cr-input"
                                value={form.publishDate}
                                onChange={e => set('publishDate', e.target.value)}
                            />
                        </div>
                        <div className="cr-field" style={{ margin: 0 }}>
                            <input
                                type="time"
                                className="cr-input"
                                value={form.publishTime}
                                onChange={e => set('publishTime', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Location ───────────────────────────────────────── */}
                    <div className="cr-section-divider">Location</div>

                    <div className="cr-field">
                        <label className="cr-label">
                            {form.format === 'online' ? 'Online link / URL' : 'Address'}
                        </label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon">
                                {form.format === 'online' ? <IconGlobe size={15} /> : <IconMapPin size={15} />}
                            </span>
                            <input
                                ref={addressInputRef}
                                className="cr-input cr-input--with-icon"
                                placeholder={form.format === 'online' ? 'https://meet.google.com/…' : 'Start typing an address…'}
                                value={form.address}
                                onChange={e => {
                                    setForm(f => ({ ...f, address: e.target.value, lat: null, lng: null }));
                                }}
                                onFocus={() => {
                                    if (form.format === 'offline' && (window as any).google && addressInputRef.current) {
                                        initAutocomplete();
                                    }
                                }}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* ── Cover ─────────────────────────────────────────── */}
                    <div className="cr-section-divider">Cover</div>

                    <div className="cr-field">
                        <div
                            className="cr-upload-zone ev-cover-zone"
                            role="button"
                            tabIndex={0}
                            onClick={() => coverInputRef.current?.click()}
                            onKeyDown={e => e.key === 'Enter' && coverInputRef.current?.click()}
                        >
                            {coverPreview ? (
                                <img className="cr-upload-preview" src={coverPreview} alt="Cover" />
                            ) : (
                                <div className="cr-upload-placeholder">
                                    <IconCamera size={28} />
                                    <span>Upload cover</span>
                                    <span className="cr-upload-hint">16:9 recommended</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleCoverChange}
                        />
                    </div>

                    {/* ── Gallery ───────────────────────────────────────── */}
                    <div className="cr-section-divider">Gallery</div>

                    {existingPhotos.length > 0 && (
                        <div className="cr-field">
                            <label className="cr-label" style={{ marginBottom: 10 }}>
                                Current photos
                                {newGalleryFiles.length > 0 && (
                                    <span style={{ color: '#ff6b00', fontWeight: 400, marginLeft: 8 }}>
                                        — will be replaced when saved
                                    </span>
                                )}
                            </label>
                            <div className="ev-gallery-grid">
                                {existingPhotos.map((url, i) => (
                                    <div key={url} className="ev-gallery-item" style={{ opacity: newGalleryFiles.length > 0 ? 0.35 : 1 }}>
                                        {isVideoUrl(url) ? (
                                            <video className="ev-gallery-thumb" src={url} muted playsInline />
                                        ) : (
                                            <img className="ev-gallery-thumb" src={url} alt={`Photo ${i + 1}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="cr-field">
                        {newGalleryFiles.length > 0 && (
                            <>
                                <label className="cr-label" style={{ marginBottom: 10 }}>New photos</label>
                                <div className="ev-gallery-grid" style={{ marginBottom: 12 }}>
                                    {newGalleryItems.map((item, i) => (
                                        <div key={item.url} className="ev-gallery-item">
                                            {item.isVideo ? (
                                                <video className="ev-gallery-thumb" src={item.url} muted playsInline />
                                            ) : (
                                                <img className="ev-gallery-thumb" src={item.url} alt={`New ${i + 1}`} />
                                            )}
                                            <button
                                                type="button"
                                                className="ev-gallery-remove"
                                                onClick={() => removeNewGalleryItem(i)}
                                                aria-label="Remove"
                                            >
                                                <IconClose size={11} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div
                            className="ev-gallery-add"
                            role="button"
                            tabIndex={0}
                            onClick={() => galleryInputRef.current?.click()}
                            onKeyDown={e => e.key === 'Enter' && galleryInputRef.current?.click()}
                        >
                            <IconPlus size={18} />
                            <span>{existingPhotos.length > 0 ? 'Replace gallery' : 'Add photos'}</span>
                        </div>
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleGalleryChange}
                        />
                    </div>

                    {/* ── Tickets ───────────────────────────────────────── */}
                    <div className="cr-section-divider">Ticket Tiers</div>

                    <p style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>
                        You can edit ticket names and capacities. Prices cannot be changed after purchase. Tiers cannot be deleted.
                    </p>

                    {tierEdits.map((edit) => {
                        const tier = tiers.find(t => t.id === edit.id);
                        return (
                            <div key={edit.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ fontSize: 11 }}>
                                        Name{edit.id === tiers[0]?.id && <span style={{ color: '#555', fontWeight: 400 }}> — default</span>}
                                    </label>
                                    <input
                                        className="cr-input"
                                        value={edit.name}
                                        onChange={e => setTierEdit(edit.id, { name: e.target.value })}
                                    />
                                </div>
                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ fontSize: 11 }}>Capacity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="cr-input"
                                        placeholder="∞"
                                        value={edit.capacity}
                                        onChange={e => setTierEdit(edit.id, { capacity: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="cr-btn cr-btn--ghost"
                                    style={{ fontSize: 12, padding: '8px 14px', alignSelf: 'flex-end' }}
                                    onClick={() => handleSaveTier(edit.id)}
                                    disabled={edit.saving}
                                >
                                    {edit.saving ? '…' : 'Save'}
                                </button>
                                {tier && (
                                    <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#555', marginTop: -4 }}>
                                        {tier.price > 0
                                            ? `${tier.currency} ${tier.price.toFixed(2)}`
                                            : 'Free'}
                                        {tier.availableSpots != null
                                            ? ` · ${tier.availableSpots} spots remaining`
                                            : ' · Unlimited'}
                                        {tier.availableSpots === 0 && (
                                            <span style={{ color: '#ff4d4d', marginLeft: 6 }}>Sold out</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 600 }}>Add ticket tier</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px auto', gap: 8, alignItems: 'flex-end' }}>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Name</label>
                                <input
                                    className="cr-input"
                                    placeholder="VIP, Early Bird…"
                                    value={newTierForm.name}
                                    onChange={e => setNewTierForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Price</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    className="cr-input"
                                    placeholder="0"
                                    value={newTierForm.price}
                                    onChange={e => setNewTierForm(f => ({ ...f, price: e.target.value }))}
                                />
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Currency</label>
                                <select
                                    className="ev-select"
                                    value={newTierForm.currency}
                                    onChange={e => setNewTierForm(f => ({ ...f, currency: e.target.value }))}
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Capacity</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="cr-input"
                                    placeholder="∞"
                                    value={newTierForm.capacity}
                                    onChange={e => setNewTierForm(f => ({ ...f, capacity: e.target.value }))}
                                />
                            </div>
                            <button
                                type="button"
                                className="ev-add-promo-btn"
                                style={{ alignSelf: 'flex-end' }}
                                onClick={handleAddTier}
                                disabled={addingTier || !newTierForm.name.trim()}
                            >
                                <IconPlus size={13} />
                                {addingTier ? '…' : 'Add'}
                            </button>
                        </div>
                    </div>

                    {/* ── Promo codes ───────────────────────────────────── */}
                    <div className="cr-section-divider">Promo Codes</div>

                    {promoCodes.length > 0 ? (
                        <table className="ev-promo-table" style={{ marginBottom: 16 }}>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Used / Max</th>
                                    <th style={{ width: 36 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {promoCodes.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600, color: '#e0e0e0', fontFamily: 'monospace' }}>{p.code}</td>
                                        <td>{p.discount}{p.discountType === 'percentage' ? '%' : ' €'} off</td>
                                        <td>{p.usedCount} / {p.maxUses ?? '∞'}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="ev-promo-remove"
                                                onClick={() => handleDeletePromo(p.id)}
                                                aria-label="Delete promo code"
                                            >
                                                <IconClose size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ fontSize: 12, color: '#444', marginBottom: 14 }}>No promo codes yet.</p>
                    )}

                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontWeight: 600 }}>Add promo code</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 80px auto', gap: 8, alignItems: 'flex-end' }}>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Code</label>
                                <input
                                    className="cr-input"
                                    placeholder="SAVE10"
                                    value={promoInput.code}
                                    onChange={e => setPromoInput(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddPromo()}
                                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Amount</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    className="cr-input"
                                    placeholder="10"
                                    value={promoInput.discount || ''}
                                    onChange={e => setPromoInput(p => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Type</label>
                                <select
                                    className="ev-select"
                                    value={promoInput.discountType}
                                    onChange={e => setPromoInput(p => ({ ...p, discountType: e.target.value as 'percentage' | 'fixed' }))}
                                >
                                    <option value="percentage">% off</option>
                                    <option value="fixed">€ off</option>
                                </select>
                            </div>
                            <div className="cr-field" style={{ margin: 0 }}>
                                <label className="cr-label" style={{ fontSize: 11 }}>Max uses</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="cr-input"
                                    placeholder="∞"
                                    value={promoInput.maxUses}
                                    onChange={e => setPromoInput(p => ({ ...p, maxUses: e.target.value }))}
                                />
                            </div>
                            <button
                                type="button"
                                className="ev-add-promo-btn"
                                style={{ alignSelf: 'flex-end' }}
                                onClick={handleAddPromo}
                                disabled={promoAdding || !promoInput.code.trim()}
                            >
                                <IconPlus size={13} />
                                {promoAdding ? '…' : 'Add'}
                            </button>
                        </div>
                    </div>

                    {/* ── Settings ──────────────────────────────────────── */}
                    <div className="cr-section-divider">Settings</div>

                    <div className="cr-field">
                        <label className="cr-label">Visitor list visibility</label>
                        <div className="ev-segmented">
                            <button
                                type="button"
                                className={`ev-segmented-btn${form.attendeeVisibility === 'everyone' ? ' ev-segmented-btn--active' : ''}`}
                                onClick={() => set('attendeeVisibility', 'everyone')}
                            >
                                Everyone
                            </button>
                            <button
                                type="button"
                                className={`ev-segmented-btn${form.attendeeVisibility === 'attendees' ? ' ev-segmented-btn--active' : ''}`}
                                onClick={() => set('attendeeVisibility', 'attendees')}
                            >
                                Attendees only
                            </button>
                        </div>
                    </div>

                    <div className="ev-toggle-row">
                        <label className="ev-toggle-label" htmlFor="ee-notif-toggle">
                            Notify me about new registrations
                            <small>You'll receive a notification each time someone registers.</small>
                        </label>
                        <div className="ev-toggle-wrap">
                            <input
                                id="ee-notif-toggle"
                                type="checkbox"
                                className="ev-toggle"
                                checked={form.organizerNotifications}
                                onChange={e => set('organizerNotifications', e.target.checked)}
                            />
                            <label
                                htmlFor="ee-notif-toggle"
                                className={`ev-toggle-track${form.organizerNotifications ? ' ev-toggle-track--on' : ''}`}
                            >
                                <span className="ev-toggle-thumb" />
                            </label>
                        </div>
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Redirect URL after purchase</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon"><IconGlobe size={15} /></span>
                            <input
                                className={`cr-input cr-input--with-icon${errors.redirectUrl ? ' cr-input--error' : ''}`}
                                placeholder="https://your-site.com/thank-you"
                                value={form.redirectUrl}
                                onChange={e => set('redirectUrl', e.target.value)}
                            />
                        </div>
                        {errors.redirectUrl && <span className="cr-error">{errors.redirectUrl}</span>}
                    </div>

                    {/* ── Status ────────────────────────────────────────── */}
                    <div className="cr-section-divider">Status</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 13, color: '#888' }}>
                            Current status:{' '}
                            <span style={{
                                fontWeight: 700,
                                color: event.status === 'published' ? '#4caf50'
                                    : event.status === 'cancelled' ? '#f44336'
                                    : '#888',
                            }}>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                        </span>
                        {event.status !== 'cancelled' && (
                            <button
                                type="button"
                                className="cr-btn cr-btn--ghost"
                                onClick={handleToggleStatus}
                                disabled={statusChanging}
                                style={{
                                    fontSize: 12,
                                    padding: '6px 14px',
                                    borderColor: event.status === 'published'
                                        ? 'rgba(244,67,54,0.4)'
                                        : 'rgba(76,175,80,0.4)',
                                    color: event.status === 'published' ? '#f44336' : '#4caf50',
                                }}
                            >
                                {statusChanging ? '…' : event.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                        )}
                    </div>

                    {/* ── Actions ───────────────────────────────────────── */}
                    <div className="cr-nav" style={{ marginTop: 32 }}>
                        <button
                            type="button"
                            className="cr-btn cr-btn--ghost"
                            onClick={() => navigate(`/events/${event.id}`)}
                        >
                            Cancel
                        </button>
                        <div className="cr-nav-spacer" />
                        <button
                            type="button"
                            className="cr-btn cr-btn--primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
