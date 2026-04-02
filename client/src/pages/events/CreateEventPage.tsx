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

interface PromoCode {
    id: string;
    code: string;
    discount: number;
}

interface CustomTicketTierForm {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface EventFormData {
    name: string;
    tags: string[];
    description: string;
    address: string;
    startDate: string;
    startTime: string;
    publishDate: string;
    publishTime: string;
    coverFile: File | null;
    galleryFiles: File[];
    isFree: boolean;
    ticketCount: number;
    price: number;
    customTiers: CustomTicketTierForm[];
    redirectUrl: string;
    attendeeVisibility: 'everyone' | 'attendees';
    organizerNotifications: boolean;
    promoCodes: PromoCode[];
}

interface FormErrors {
    name?: string;
    tags?: string;
    description?: string;
    startDate?: string;
    startTime?: string;
    ticketCount?: string;
    price?: string;
    customTiers?: string;
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
        address: '',
        startDate: '',
        startTime: '',
        publishDate: '',
        publishTime: '',
        coverFile: null,
        galleryFiles: [],
        isFree: true,
        ticketCount: 1,
        price: 0,
        customTiers: [],
        redirectUrl: '',
        attendeeVisibility: 'everyone',
        organizerNotifications: true,
        promoCodes: [],
    });

    // ── Media previews ──────────────────────────────────────────────────────

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            galleryPreviews.forEach(u => URL.revokeObjectURL(u));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        const newUrls = files.map(f => URL.createObjectURL(f));
        setForm(prev => ({ ...prev, galleryFiles: [...prev.galleryFiles, ...files] }));
        setGalleryPreviews(prev => [...prev, ...newUrls]);
        e.target.value = '';
    }

    function removeGalleryItem(idx: number) {
        URL.revokeObjectURL(galleryPreviews[idx]);
        setForm(prev => ({
            ...prev,
            galleryFiles: prev.galleryFiles.filter((_, i) => i !== idx),
        }));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
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

    // ── Custom ticket tiers ─────────────────────────────────────────────

    function addCustomTier() {
        setForm(prev => ({
            ...prev,
            customTiers: [
                ...prev.customTiers,
                {
                    id: crypto.randomUUID(),
                    name: 'VIP',
                    price: prev.isFree ? 0 : prev.price,
                    quantity: 1,
                },
            ],
        }));
        setErrors(prev => ({ ...prev, customTiers: undefined }));
    }

    function removeCustomTier(tierId: string) {
        setForm(prev => ({
            ...prev,
            customTiers: prev.customTiers.filter(t => t.id !== tierId),
        }));
    }

    function updateCustomTier(
        tierId: string,
        field: 'name' | 'price' | 'quantity',
        value: string | number,
    ) {
        setForm(prev => ({
            ...prev,
            customTiers: prev.customTiers.map(t => {
                if (t.id !== tierId) return t;
                return {
                    ...t,
                    [field]: field === 'name' ? String(value) : Number(value),
                };
            }),
        }));
        setErrors(prev => ({ ...prev, customTiers: undefined }));
    }

    // ── Promo codes ─────────────────────────────────────────────────────────

    function addPromo() {
        setForm(prev => ({
            ...prev,
            promoCodes: [...prev.promoCodes, { id: crypto.randomUUID(), code: '', discount: 10 }],
        }));
    }

    function updatePromo(id: string, field: 'code' | 'discount', value: string | number) {
        setForm(prev => ({
            ...prev,
            promoCodes: prev.promoCodes.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            ),
        }));
    }

    function removePromo(id: string) {
        setForm(prev => ({
            ...prev,
            promoCodes: prev.promoCodes.filter(p => p.id !== id),
        }));
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
            if (form.ticketCount < 1) e.ticketCount = 'At least 1 ticket is required.';
            if (!form.isFree && form.price <= 0) e.price = 'Enter a valid price.';

            if (form.customTiers.length) {
                const invalid = form.customTiers.some(t => {
                    const nameOk = t.name.trim().length >= 1;
                    const qtyOk = Number.isFinite(t.quantity) && t.quantity >= 1;
                    const priceOk = Number.isFinite(t.price) && t.price >= 0;
                    return !(nameOk && qtyOk && priceOk);
                });
                if (invalid) e.customTiers = 'Fix all custom ticket types (name, price, quantity).';
            }

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
                format: 'offline',
                category: form.tags[0] ?? 'General',
                tags: form.tags,
                date: start.toISOString(),
                location: form.address,
                price: form.isFree ? 0 : form.price,
                currency: 'EUR',
                capacity: form.ticketCount,
                tickets: [
                    {
                        name: 'General admission',
                        price: form.isFree ? 0 : form.price,
                        currency: 'EUR',
                        capacity: form.ticketCount,
                    },
                    ...form.customTiers.map(t => ({
                        name: t.name,
                        price: t.price,
                        currency: 'EUR',
                        capacity: t.quantity,
                    })),
                ],
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
                    <label className="cr-label">Address / Location</label>
                    <div className="cr-input-icon-wrap">
                        <span className="cr-input-icon"><IconMapPin size={15} /></span>
                        <input
                            className="cr-input cr-input--with-icon"
                            placeholder="Address or Google Maps link"
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
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
                        {galleryPreviews.map((url, i) => (
                            <div key={url} className="ev-gallery-item">
                                <img className="ev-gallery-thumb" src={url} alt={`Gallery ${i + 1}`} />
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

                {/* Free / Paid */}
                <div className="cr-field">
                    <label className="cr-label">Pricing</label>
                    <div className="ev-segmented">
                        <button
                            type="button"
                            className={`ev-segmented-btn${form.isFree ? ' ev-segmented-btn--active' : ''}`}
                            onClick={() => set('isFree', true)}
                        >
                            Free
                        </button>
                        <button
                            type="button"
                            className={`ev-segmented-btn${!form.isFree ? ' ev-segmented-btn--active' : ''}`}
                            onClick={() => set('isFree', false)}
                        >
                            Paid
                        </button>
                    </div>
                </div>

                {/* Ticket count */}
                <div className="cr-field">
                    <label className="cr-label">Number of Tickets <span className="cr-required">*</span></label>
                    <div className="ev-qty-control">
                        <button
                            type="button"
                            className="ev-qty-btn"
                            disabled={form.ticketCount <= 1}
                            onClick={() => set('ticketCount', Math.max(1, form.ticketCount - 1))}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            className="ev-qty-input"
                            value={form.ticketCount}
                            min={1}
                            onChange={e => {
                                const v = parseInt(e.target.value) || 1;
                                set('ticketCount', Math.max(1, v));
                            }}
                        />
                        <button
                            type="button"
                            className="ev-qty-btn"
                            onClick={() => set('ticketCount', form.ticketCount + 1)}
                        >
                            +
                        </button>
                    </div>
                    {errors.ticketCount && <span className="cr-error">{errors.ticketCount}</span>}
                </div>

                {/* Price */}
                {!form.isFree && (
                    <div className="cr-field">
                        <label className="cr-label">Price <span className="cr-required">*</span></label>
                        <div className="ev-price-wrap">
                            <span className="ev-price-prefix">€</span>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                className={`cr-input ev-price-input${errors.price ? ' cr-input--error' : ''}`}
                                placeholder="0.00"
                                value={form.price || ''}
                                onChange={e => set('price', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        {errors.price && <span className="cr-error">{errors.price}</span>}
                    </div>
                )}

                {/* Additional ticket types */}
                <div className="cr-section-divider">Ticket types</div>
                {form.customTiers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {form.customTiers.map(tier => (
                            <div
                                key={tier.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 140px 140px 42px',
                                    gap: 10,
                                    alignItems: 'end',
                                }}
                            >
                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>
                                        Name
                                    </label>
                                    <input
                                        className={`cr-input${errors.customTiers ? ' cr-input--error' : ''}`}
                                        value={tier.name}
                                        onChange={e => updateCustomTier(tier.id, 'name', e.target.value)}
                                    />
                                </div>

                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        className="cr-input"
                                        value={tier.price}
                                        onChange={e => updateCustomTier(tier.id, 'price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="cr-field" style={{ margin: 0 }}>
                                    <label className="cr-label" style={{ display: 'block' }}>
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="cr-input"
                                        value={tier.quantity}
                                        onChange={e => updateCustomTier(tier.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="cr-btn cr-btn--ghost"
                                    style={{ padding: 8, justifySelf: 'end' }}
                                    onClick={() => removeCustomTier(tier.id)}
                                    aria-label="Remove ticket type"
                                >
                                    <IconClose size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ marginTop: -2, color: '#777' }}>No additional ticket types yet.</p>
                )}

                <button type="button" className="ev-add-promo-btn" onClick={addCustomTier}>
                    <IconPlus size={13} />
                    Add ticket type
                </button>
                {errors.customTiers && <span className="cr-error">{errors.customTiers}</span>}

                {/* Redirect URL */}
                <div className="cr-field">
                    <label className="cr-label">Redirect after purchase</label>
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

                {/* Promo codes */}
                <div className="cr-section-divider">Promo Codes</div>

                {form.promoCodes.length > 0 && (
                    <div className="ev-promo-list">
                        {form.promoCodes.map(p => (
                            <div key={p.id} className="ev-promo-row">
                                <input
                                    className="cr-input"
                                    placeholder="CODE"
                                    maxLength={20}
                                    value={p.code}
                                    onChange={e => updatePromo(p.id, 'code', e.target.value.toUpperCase())}
                                />
                                <div className="ev-discount-wrap">
                                    <input
                                        type="number"
                                        className="cr-input ev-discount-input"
                                        placeholder="10"
                                        min={1}
                                        max={100}
                                        value={p.discount || ''}
                                        onChange={e => updatePromo(p.id, 'discount', Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                                    />
                                    <span className="ev-discount-suffix">%</span>
                                </div>
                                <button
                                    type="button"
                                    className="ev-promo-remove"
                                    onClick={() => removePromo(p.id)}
                                    aria-label="Remove promo code"
                                >
                                    <IconClose size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button type="button" className="ev-add-promo-btn" onClick={addPromo}>
                    <IconPlus size={13} />
                    Add Promo Code
                </button>
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
                                {1 + form.customTiers.length} type{1 + form.customTiers.length === 1 ? '' : 's'} ·{' '}
                                min price:{' '}
                                {(() => {
                                    const prices = [
                                        form.isFree ? 0 : form.price,
                                        ...form.customTiers.map(t => t.price),
                                    ];
                                    const min = Math.min(...prices);
                                    return min === 0 ? 'Free' : `€${min.toFixed(2)}`;
                                })()}
                            </span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Count</span>
                            <span className="cr-review-value">
                                {(
                                    form.ticketCount +
                                    form.customTiers.reduce((s, t) => s + t.quantity, 0)
                                ).toLocaleString()}
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

                        {form.promoCodes.length > 0 && (
                            <div className="cr-review-row cr-review-row--block" style={{ marginTop: 8 }}>
                                <span className="cr-review-label">Promo Codes</span>
                                <table className="ev-promo-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.promoCodes.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontFamily: 'monospace' }}>{p.code || '—'}</td>
                                                <td>{p.discount}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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