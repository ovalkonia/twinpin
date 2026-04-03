import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    IconMapPin,
    IconGlobe,
    IconPlus,
    IconClose,
    IconCheck,
    IconCamera,
} from '../../assets/icons';
import '../../styles/company-register.css';
import '../../styles/create-event.css';

import { getMyCompany } from '../../services/company';
import { createEvent } from '../../services/events';
import type { Company } from '../../services/company';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Event', 'Details', 'Media', 'Tickets', 'Review'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketTierFormItem {
    id: string;
    name: string;
    price: number;
    capacity: number;
}

interface GalleryItem {
    url: string;
    isVideo: boolean;
}

interface EventFormData {
    name: string;
    tags: string[];
    description: string;
    format: 'online' | 'offline';
    address: string;
    lat: number | null;
    lng: number | null;
    startDate: string;
    startTime: string;
    publishDate: string;
    publishTime: string;
    coverFile: File | null;
    galleryFiles: File[];
    tiers: TicketTierFormItem[];
    redirectUrl: string;
    attendeeVisibility: 'everyone' | 'attendees';
    organizerNotifications: boolean;
}

interface FormErrors {
    name?: string;
    tags?: string;
    description?: string;
    startDate?: string;
    startTime?: string;
    tiers?: string;
    redirectUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(s: string): boolean {
    try { new URL(s); return true; } catch { return false; }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
    <div className="cr-step-indicator">
        {STEPS.map((label, i) => {
            const state = i < current ? 'done' : i === current ? 'active' : 'future';
            return (
                <React.Fragment key={label}>
                    <div className={`cr-step cr-step--${state}`}>
                        <div className="cr-step-circle">
                            {state === 'done' ? <IconCheck size={14} /> : i + 1}
                        </div>
                        <span className="cr-step-label">{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`cr-step-line${state === 'done' ? ' cr-step-line--done' : ''}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const CreateEventPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [myCompany, setMyCompany] = useState<Company | null>(null);

    const [form, setForm] = useState<EventFormData>({
        name: '',
        tags: [],
        description: '',
        format: 'offline',
        address: '',
        lat: null,
        lng: null,
        startDate: '',
        startTime: '',
        publishDate: '',
        publishTime: '',
        coverFile: null,
        galleryFiles: [],
        tiers: [{ id: crypto.randomUUID(), name: 'General Admission', price: 0, capacity: 1 }],
        redirectUrl: '',
        attendeeVisibility: 'everyone',
        organizerNotifications: true,
    });

    // ── Media previews ──────────────────────────────────────────────────────

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            galleryItems.forEach(g => URL.revokeObjectURL(g.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Google Maps Places Autocomplete ────────────────────────────────────

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'your_google_maps_api_key') return;
        if (document.getElementById('gm-places-script')) return;

        const script = document.createElement('script');
        script.id = 'gm-places-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);

        return () => {
            // script persists across re-renders intentionally
        };
    }, []);

    function initAutocomplete() {
        if (!addressInputRef.current || !window.google) return;
        const ac = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['geocode', 'establishment'],
        });
        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place.formatted_address ?? place.name ?? '';
            const lat = place.geometry?.location?.lat() ?? null;
            const lng = place.geometry?.location?.lng() ?? null;
            setForm(prev => ({ ...prev, address: addr, lat, lng }));
            setErrors(prev => ({ ...prev, address: undefined }));
        });
    }

    useEffect(() => {
        getMyCompany()
            .then((c) => setMyCompany(c))
            .catch(() => setMyCompany(null));
    }, []);

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        const url = URL.createObjectURL(file);
        setForm(f => ({ ...f, coverFile: file }));
        setCoverPreview(url);
    }

    function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const newItems: GalleryItem[] = files.map(f => ({
            url: URL.createObjectURL(f),
            isVideo: f.type.startsWith('video/'),
        }));
        setForm(prev => ({ ...prev, galleryFiles: [...prev.galleryFiles, ...files] }));
        setGalleryItems(prev => [...prev, ...newItems]);
        e.target.value = '';
    }

    function removeGalleryItem(idx: number) {
        URL.revokeObjectURL(galleryItems[idx].url);
        setForm(prev => ({
            ...prev,
            galleryFiles: prev.galleryFiles.filter((_, i) => i !== idx),
        }));
        setGalleryItems(prev => prev.filter((_, i) => i !== idx));
    }

    // ── Field helpers ───────────────────────────────────────────────────────

    function set<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    // ── Tag helpers ─────────────────────────────────────────────────────────

    function addTag(value: string) {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (form.tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) return;
        setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
        setErrors(prev => ({ ...prev, tags: undefined }));
    }

    function removeTag(tag: string) {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    }

    // ── Ticket tiers ────────────────────────────────────────────────────────

    function addTier() {
        setForm(prev => ({
            ...prev,
            tiers: [...prev.tiers, { id: crypto.randomUUID(), name: '', price: 0, capacity: 1 }],
        }));
        setErrors(prev => ({ ...prev, tiers: undefined }));
    }

    function removeTier(tierId: string) {
        setForm(prev => {
            if (prev.tiers.length <= 1) return prev;
            return { ...prev, tiers: prev.tiers.filter(t => t.id !== tierId) };
        });
    }

    function updateTier(tierId: string, field: 'name' | 'price' | 'capacity', value: string | number) {
        setForm(prev => ({
            ...prev,
            tiers: prev.tiers.map(t =>
                t.id !== tierId ? t : { ...t, [field]: field === 'name' ? String(value) : Number(value) }
            ),
        }));
        setErrors(prev => ({ ...prev, tiers: undefined }));
    }

    // ── Validation ──────────────────────────────────────────────────────────

    function validateStep(s: number): boolean {
        const e: FormErrors = {};
        if (s === 0) {
            if (!form.name.trim()) e.name = 'Event name is required.';
            if (form.tags.length === 0) e.tags = 'Please add at least one category tag.';
            if (form.tags.length > 0 && form.tags[0].length > 120) {
                e.tags = 'The first tag (category) must be <= 120 characters.';
            }
        }
        if (s === 1) {
            if (!form.description.trim()) e.description = 'Description is required.';
            if (!form.startDate) e.startDate = 'Start date is required.';
            if (!form.startTime) e.startTime = 'Start time is required.';
        }
        if (s === 3) {
            const invalid = form.tiers.some(
                t => t.name.trim().length < 1 || t.capacity < 1 || t.price < 0
            );
            if (invalid) e.tiers = 'Each ticket type needs a name, a capacity ≥ 1, and a price ≥ 0.';

            if (form.redirectUrl && !isValidUrl(form.redirectUrl))
                e.redirectUrl = 'Enter a valid URL (including https://).';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleNext() {
        if (validateStep(step)) setStep(s => s + 1);
    }

    function handleBack() {
        setErrors({});
        setStep(s => s - 1);
    }

    async function handleSubmit() {
        setSubmitting(true);
        try {
            const start = new Date(`${form.startDate}T${form.startTime}:00`);
            const publishAt = form.publishDate
                ? new Date(`${form.publishDate}T${form.publishTime || '00:00'}:00`)
                : null;

            const payload: any = {
                title: form.name,
                description: form.description,
                format: form.format,
                category: form.tags[0] ?? 'General',
                tags: form.tags,
                date: start.toISOString(),
                location: form.address || undefined,
                lat: form.lat ?? undefined,
                lng: form.lng ?? undefined,
                tickets: form.tiers.map(t => ({
                    name: t.name,
                    price: t.price,
                    currency: 'EUR',
                    capacity: t.capacity,
                })),
                cover: form.coverFile ?? undefined,
                photos: form.galleryFiles.length ? form.galleryFiles : undefined,
                // Always publish so the event shows up on the dashboard.
                // publishAt is only used for scheduled visibility.
                status: 'published',
                publishAt: publishAt ? publishAt.toISOString() : undefined,
                visitorListPrivacy:
                    form.attendeeVisibility === 'everyone' ? 'everybody' : 'attendees',
                notifyOnNewVisitor: form.organizerNotifications,
                redirectAfterPurchase: form.redirectUrl || undefined,
            };

            const created = await createEvent(payload);
            toast.success('Event created successfully!');
            navigate(`/events/${created.id}/edit`);
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to create event');
        } finally {
            setSubmitting(false);
        }
    }

    // ── Render steps ────────────────────────────────────────────────────────

    function renderStep0() {
        return (
            <div className="cr-step-content" key="s0">
                <h2 className="cr-step-title">Event Info</h2>

                <div className="cr-field">
                    <label className="cr-label">
                        Event Name <span className="cr-required">*</span>
                    </label>
                    <input
                        className={`cr-input${errors.name ? ' cr-input--error' : ''}`}
                        placeholder="e.g. Tech Summit 2026"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                    />
                    {errors.name && <span className="cr-error">{errors.name}</span>}
                </div>

                <div className="cr-field">
                    <label className="cr-label">
                        Category / Tags <span className="cr-required">*</span>
                    </label>

                    {/* Selected tags */}
                    {form.tags.length > 0 && (
                        <div className="cr-chips ev-tag-list">
                            {form.tags.map(t => (
                                <span key={t} className="cr-chip cr-chip--selected ev-tag">
                                    {t}
                                    <button
                                        type="button"
                                        className="ev-tag-remove"
                                        onClick={() => removeTag(t)}
                                        aria-label={`Remove tag ${t}`}
                                    >
                                        <IconClose size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Text input */}
                    <input
                        className={`cr-input${errors.tags ? ' cr-input--error' : ''}`}
                        placeholder="e.g. Music, Tech, Outdoor…"
                        value={tagInput}
                        onChange={e => {
                            const val = e.target.value;
                            if (val.endsWith(',')) {
                                addTag(val.slice(0, -1));
                                setTagInput('');
                            } else {
                                setTagInput(val);
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(tagInput);
                                setTagInput('');
                            }
                        }}
                    />

                    {errors.tags && <span className="cr-error">{errors.tags}</span>}
                </div>
            </div>
        );
    }

    function renderStep1() {
        return (
            <div className="cr-step-content" key="s1">
                <h2 className="cr-step-title">Details</h2>

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
                    <label className="cr-label">
                        Description <span className="cr-required">*</span>
                    </label>
                    <textarea
                        className={`cr-textarea${errors.description ? ' cr-input--error' : ''}`}
                        placeholder="Tell people what your event is about…"
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                    />
                    {errors.description && <span className="cr-error">{errors.description}</span>}
                </div>

                <div className="cr-field">
                    <label className="cr-label">
                        {form.format === 'online' ? 'Online link / URL' : 'Address / Location'}
                    </label>
                    <div className="cr-input-icon-wrap">
                        <span className="cr-input-icon"><IconMapPin size={15} /></span>
                        <input
                            ref={addressInputRef}
                            className="cr-input cr-input--with-icon"
                            placeholder={form.format === 'online' ? 'https://meet.google.com/…' : 'Start typing an address…'}
                            value={form.address}
                            onChange={e => {
                                setForm(prev => ({ ...prev, address: e.target.value, lat: null, lng: null }));
                                setErrors(prev => ({ ...prev, address: undefined }));
                            }}
                            onFocus={() => {
                                if (form.format === 'offline' && window.google && addressInputRef.current) {
                                    initAutocomplete();
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="ev-datetime-row">
                    <div className="cr-field" style={{ margin: 0 }}>
                        <label className="cr-label">
                            Start Date <span className="cr-required">*</span>
                        </label>
                        <input
                            type="date"
                            className={`cr-input${errors.startDate ? ' cr-input--error' : ''}`}
                            value={form.startDate}
                            onChange={e => set('startDate', e.target.value)}
                        />
                        {errors.startDate && <span className="cr-error">{errors.startDate}</span>}
                    </div>
                    <div className="cr-field" style={{ margin: 0 }}>
                        <label className="cr-label">
                            Start Time <span className="cr-required">*</span>
                        </label>
                        <input
                            type="time"
                            className={`cr-input${errors.startTime ? ' cr-input--error' : ''}`}
                            value={form.startTime}
                            onChange={e => set('startTime', e.target.value)}
                        />
                        {errors.startTime && <span className="cr-error">{errors.startTime}</span>}
                    </div>
                </div>

                <div className="cr-field" style={{ marginTop: 20, marginBottom: 4 }}>
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
            </div>
        );
    }

    function renderStep2() {
        return (
            <div className="cr-step-content" key="s2">
                <h2 className="cr-step-title">Media</h2>

                {/* Cover */}
                <div className="cr-field">
                    <label className="cr-label">Cover Image <span style={{ color: '#555', fontWeight: 400 }}>(16:9 recommended)</span></label>
                    <div
                        className="cr-upload-zone ev-cover-zone"
                        role="button"
                        tabIndex={0}
                        onClick={() => coverInputRef.current?.click()}
                        onKeyDown={e => e.key === 'Enter' && coverInputRef.current?.click()}
                    >
                        {coverPreview ? (
                            <img className="cr-upload-preview" src={coverPreview} alt="Cover preview" />
                        ) : (
                            <div className="cr-upload-placeholder">
                                <IconCamera size={28} />
                                <span>Click to upload cover</span>
                                <span className="cr-upload-hint">JPG, PNG, WEBP</span>
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

                {/* Gallery */}
                <div className="cr-field">
                    <label className="cr-label">Gallery <span style={{ color: '#555', fontWeight: 400 }}>(photos & videos)</span></label>
                    <div className="ev-gallery-grid">
                        {galleryItems.map((item, i) => (
                            <div key={item.url} className="ev-gallery-item">
                                {item.isVideo ? (
                                    <video
                                        className="ev-gallery-thumb"
                                        src={item.url}
                                        muted
                                        playsInline
                                        onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                                        onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                                    />
                                ) : (
                                    <img className="ev-gallery-thumb" src={item.url} alt={`Gallery ${i + 1}`} />
                                )}
                                <button
                                    type="button"
                                    className="ev-gallery-remove"
                                    onClick={() => removeGalleryItem(i)}
                                    aria-label="Remove"
                                >
                                    <IconClose size={11} />
                                </button>
                            </div>
                        ))}
                        <div
                            className="ev-gallery-add"
                            role="button"
                            tabIndex={0}
                            onClick={() => galleryInputRef.current?.click()}
                            onKeyDown={e => e.key === 'Enter' && galleryInputRef.current?.click()}
                        >
                            <IconPlus size={20} />
                            <span>Add</span>
                        </div>
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
            </div>
        );
    }

    function renderStep3() {
        return (
            <div className="cr-step-content" key="s3">
                <h2 className="cr-step-title">Tickets & Settings</h2>

                {/* Ticket types */}
                <div className="cr-section-divider">Ticket types</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {form.tiers.map((tier, idx) => (
                        <div
                            key={tier.id}
                            style={{
                                background: '#111',
                                border: '1px solid rgba(255,107,0,0.15)',
                                borderRadius: 14,
                                padding: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 130px 110px 38px',
                                    gap: 10,
                                    alignItems: 'end',
                                }}
                            >
                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>
                                        Name {idx === 0 && <span className="cr-required">*</span>}
                                    </label>
                                    <input
                                        className={`cr-input${errors.tiers && tier.name.trim().length < 1 ? ' cr-input--error' : ''}`}
                                        placeholder={idx === 0 ? 'General Admission' : 'e.g. VIP'}
                                        value={tier.name}
                                        onChange={e => updateTier(tier.id, 'name', e.target.value)}
                                    />
                                </div>

                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>Price</label>
                                    <div className="ev-price-wrap">
                                        <span className="ev-price-prefix">€</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="cr-input ev-price-input"
                                            placeholder="0.00"
                                            value={tier.price || ''}
                                            onChange={e => updateTier(tier.id, 'price', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>Capacity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={`cr-input${errors.tiers && tier.capacity < 1 ? ' cr-input--error' : ''}`}
                                        value={tier.capacity}
                                        onChange={e => updateTier(tier.id, 'capacity', Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="cr-btn cr-btn--ghost"
                                    style={{ padding: 8, justifySelf: 'end', opacity: form.tiers.length <= 1 ? 0.3 : 1 }}
                                    disabled={form.tiers.length <= 1}
                                    onClick={() => removeTier(tier.id)}
                                    aria-label="Remove ticket type"
                                >
                                    <IconClose size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {errors.tiers && <span className="cr-error" style={{ marginTop: 6, display: 'block' }}>{errors.tiers}</span>}

                <button type="button" className="ev-add-promo-btn" onClick={addTier} style={{ marginTop: 12 }}>
                    <IconPlus size={13} />
                    Add ticket type
                </button>

                {/* Redirect URL */}
                <div className="cr-section-divider" style={{ marginTop: 20 }}>After purchase</div>
                <div className="cr-field">
                    <label className="cr-label">Redirect URL</label>
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

                {/* Settings */}
                <div className="cr-section-divider">Settings</div>

                {/* Visitor visibility */}
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

                {/* Notifications toggle */}
                <div className="ev-toggle-row">
                    <label className="ev-toggle-label" htmlFor="ev-notif-toggle">
                        Notify me about new registrations
                        <small>You'll receive a notification each time someone registers.</small>
                    </label>
                    <div className="ev-toggle-wrap">
                        <input
                            id="ev-notif-toggle"
                            type="checkbox"
                            className="ev-toggle"
                            checked={form.organizerNotifications}
                            onChange={e => set('organizerNotifications', e.target.checked)}
                        />
                        <label
                            htmlFor="ev-notif-toggle"
                            className={`ev-toggle-track${form.organizerNotifications ? ' ev-toggle-track--on' : ''}`}
                        >
                            <span className="ev-toggle-thumb" />
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    function renderStep4() {
        const dateStr = form.startDate
            ? new Date(form.startDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—';

        return (
            <div className="cr-step-content" key="s4">
                <h2 className="cr-step-title">Review</h2>
                <p className="cr-review-hint">Check everything looks right before publishing.</p>

                {/* Cover preview */}
                <div className="ev-review-cover">
                    {coverPreview ? (
                        <img src={coverPreview} alt="Cover" />
                    ) : (
                        <div className="ev-review-cover-placeholder">No cover image</div>
                    )}
                </div>

                <div className="cr-review">
                    {/* Event */}
                    <div className="cr-review-section">
                        <p className="cr-review-section-title">Event</p>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Name</span>
                            <span className="cr-review-value">{form.name || '—'}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Company</span>
                            <span className="cr-review-value">{myCompany?.name || 'your company'}</span>
                        </div>
                        <div className="cr-review-row cr-review-row--block">
                            <span className="cr-review-label">Tags</span>
                            <div className="cr-chips" style={{ marginTop: 4 }}>
                                {form.tags.length > 0
                                    ? form.tags.map(t => (
                                        <span key={t} className="cr-chip cr-chip--selected cr-chip--sm">{t}</span>
                                    ))
                                    : <span className="cr-review-value">—</span>}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="cr-review-section">
                        <p className="cr-review-section-title">Details</p>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Format</span>
                            <span className="cr-review-value">{form.format === 'online' ? 'Online' : 'In-person'}</span>
                        </div>
                        {form.description && (
                            <div className="cr-review-row cr-review-row--block">
                                <span className="cr-review-label">Description</span>
                                <span className="cr-review-description">
                                    {form.description.length > 200
                                        ? form.description.slice(0, 200) + '…'
                                        : form.description}
                                </span>
                            </div>
                        )}
                        <div className="cr-review-row">
                            <span className="cr-review-label">Address</span>
                            <span className="cr-review-value">{form.address || '—'}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Date</span>
                            <span className="cr-review-value">{dateStr}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Time</span>
                            <span className="cr-review-value">{form.startTime || '—'}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Publishes</span>
                            <span className="cr-review-value">
                                {form.publishDate
                                    ? `${new Date(form.publishDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${form.publishTime ? ` at ${form.publishTime}` : ''}`
                                    : 'Immediately'}
                            </span>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="cr-review-section">
                        <p className="cr-review-section-title">Media</p>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Cover</span>
                            <span className="cr-review-value">{form.coverFile ? form.coverFile.name : 'None'}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Gallery</span>
                            <span className="cr-review-value">
                                {form.galleryFiles.length > 0
                                    ? `${form.galleryFiles.length} file${form.galleryFiles.length > 1 ? 's' : ''}`
                                    : 'None'}
                            </span>
                        </div>
                    </div>

                    {/* Tickets */}
                    <div className="cr-review-section">
                        <p className="cr-review-section-title">Tickets</p>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Type</span>
                            <span className="cr-review-value">
                                {form.tiers.length} type{form.tiers.length === 1 ? '' : 's'} ·{' '}
                                min price:{' '}
                                {(() => {
                                    const min = Math.min(...form.tiers.map(t => t.price));
                                    return min === 0 ? 'Free' : `€${min.toFixed(2)}`;
                                })()}
                            </span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Count</span>
                            <span className="cr-review-value">
                                {form.tiers.reduce((s, t) => s + t.capacity, 0).toLocaleString()}
                            </span>
                        </div>
                        {form.redirectUrl && (
                            <div className="cr-review-row">
                                <span className="cr-review-label">Redirect</span>
                                <span className="cr-review-value" style={{ wordBreak: 'break-all' }}>{form.redirectUrl}</span>
                            </div>
                        )}
                        <div className="cr-review-row">
                            <span className="cr-review-label">Visibility</span>
                            <span className="cr-review-value">
                                {form.attendeeVisibility === 'everyone' ? 'Visible to everyone' : 'Attendees only'}
                            </span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Notifications</span>
                            <span className="cr-review-value">{form.organizerNotifications ? 'On' : 'Off'}</span>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

    // ── Layout ──────────────────────────────────────────────────────────────

    return (
        <div className="ev-page">
            <Header />
            <div className="ev-container">
                <h1 className="ev-heading">Create Event</h1>
                <StepIndicator current={step} />
                <div className="ev-card">
                    {stepRenderers[step]()}

                    {/* Navigation */}
                    <div className="cr-nav">
                        {step > 0 && (
                            <button type="button" className="cr-btn cr-btn--ghost" onClick={handleBack}>
                                Back
                            </button>
                        )}
                        <div className="cr-nav-spacer" />
                        {step < STEPS.length - 1 ? (
                            <button type="button" className="cr-btn cr-btn--primary" onClick={handleNext}>
                                Next
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="cr-btn cr-btn--primary"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? 'Publishing…' : 'Publish Event'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};