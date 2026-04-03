import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    IconBuilding,
    IconCamera,
    IconCheck,
    IconGlobe,
    IconInstagram,
    IconLinkedIn,
    IconMapPin,
    IconTelegram,
    IconTikTok,
} from '../../assets/icons';
import '../../styles/company-register.css';
import { registerCompany } from '../../services/company';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyFormData {
    name: string;
    slug: string;
    logo: File | null;
    cover: File | null;
    description: string;
    categories: string[];
    website: string;
    email: string;
    address: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    telegram: string;
}

const INITIAL_FORM: CompanyFormData = {
    name: '', slug: '', logo: null, cover: null,
    description: '', categories: [],
    website: '', email: '', address: '',
    linkedin: '', instagram: '', tiktok: '', telegram: '',
};

const CATEGORIES = ['IT', 'Music', 'Charity', 'Sport', 'Art', 'Food', 'Business', 'Education'];

const STEP_LABELS = ['Identity', 'About', 'Contact', 'Review'];

const SOCIAL_FIELDS: { key: keyof CompanyFormData; label: string; placeholder: string; icon: React.ReactNode }[] = [
    { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'linkedin.com/company/your-company', icon: <IconLinkedIn size={15} /> },
    { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/your-handle',          icon: <IconInstagram size={15} /> },
    { key: 'tiktok',    label: 'TikTok',    placeholder: 'tiktok.com/@your-handle',             icon: <IconTikTok size={15} /> },
    { key: 'telegram',  label: 'Telegram',  placeholder: 't.me/your-channel',                   icon: <IconTelegram size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (text: string): string =>
    text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const URL_RE = /^https?:\/\/.+\..+/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Component ────────────────────────────────────────────────────────────────

export const RegisterCompanyPage: React.FC = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<CompanyFormData>(INITIAL_FORM);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const logoInputRef    = useRef<HTMLInputElement>(null);
    const coverInputRef   = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    // Revoke object URLs on unmount
    useEffect(() => {
        return () => {
            if (logoPreview) URL.revokeObjectURL(logoPreview);
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Google Maps Places autocomplete for address
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
        if (!apiKey || apiKey === 'your_google_maps_api_key') return;
        if (document.getElementById('gm-places-script')) {
            initAddressAutocomplete();
            return;
        }
        const script = document.createElement('script');
        script.id = 'gm-places-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initAddressAutocomplete;
        document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initAddressAutocomplete() {
        if (!addressInputRef.current || !(window as any).google) return;
        const ac = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['geocode', 'establishment'],
        });
        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place.formatted_address ?? place.name ?? '';
            setForm(f => ({ ...f, address: addr }));
            setErrors(prev => ({ ...prev, address: '' }));
        });
    }

    // ── Field handlers ──────────────────────────────────────────────────────

    const handleNameChange = (value: string) => {
        setForm(f => ({
            ...f,
            name: value,
            slug: slugManuallyEdited ? f.slug : slugify(value),
        }));
    };

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true);
        setForm(f => ({ ...f, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setForm(f => ({ ...f, logo: file }));
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setForm(f => ({ ...f, cover: file }));
        setCoverPreview(URL.createObjectURL(file));
    };

    const toggleCategory = (cat: string) => {
        setForm(f => ({
            ...f,
            categories: f.categories.includes(cat)
                ? f.categories.filter(c => c !== cat)
                : [...f.categories, cat],
        }));
    };

    // ── Validation ──────────────────────────────────────────────────────────

    const validateStep0 = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Company name is required.';
        if (!form.slug.trim()) {
            e.slug = 'Slug is required.';
        } else if (form.slug.length < 3) {
            e.slug = 'Slug must be at least 3 characters.';
        } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(form.slug)) {
            e.slug = 'Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep1 = (): boolean => {
        const e: Record<string, string> = {};
        if (form.categories.length === 0) e.categories = 'Select at least one category.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = (): boolean => {
        const e: Record<string, string> = {};
        if (form.website && !URL_RE.test(form.website))
            e.website = 'Enter a valid URL (must start with http:// or https://).';
        if (form.email && !EMAIL_RE.test(form.email))
            e.email = 'Enter a valid email address.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validators = [validateStep0, validateStep1, validateStep2, () => true];

    // ── Navigation ──────────────────────────────────────────────────────────

    const handleNext = () => {
        if (validators[step]()) {
            setErrors({});
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setErrors({});
        setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await registerCompany({
                name: form.name,
                slug: form.slug,
                description: form.description,
                categories: form.categories,
                website: form.website,
                email: form.email,
                address: form.address,
                linkedin: form.linkedin,
                instagram: form.instagram,
                tiktok: form.tiktok,
                telegram: form.telegram,
                logo: form.logo ?? undefined,
                cover: form.cover ?? undefined,
            });
            toast.success('Company registered successfully!');
            navigate('/company');
        } catch {
            toast.error('Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step indicator ──────────────────────────────────────────────────────

    const renderStepIndicator = () => (
        <div className="cr-step-indicator">
            {STEP_LABELS.map((label, i) => (
                <React.Fragment key={i}>
                    <div className={`cr-step cr-step--${i < step ? 'done' : i === step ? 'active' : 'future'}`}>
                        <div className="cr-step-circle">
                            {i < step ? <IconCheck size={14} /> : i + 1}
                        </div>
                        <span className="cr-step-label">{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                        <div className={`cr-step-line${i < step ? ' cr-step-line--done' : ''}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // ── Navigation row ──────────────────────────────────────────────────────

    const renderNav = () => (
        <div className="cr-nav">
            {step > 0 && (
                <button className="cr-btn cr-btn--ghost" onClick={handleBack}>
                    Back
                </button>
            )}
            <div className="cr-nav-spacer" />
            {step < 3 ? (
                <button className="cr-btn cr-btn--primary" onClick={handleNext}>
                    Next
                </button>
            ) : (
                <button
                    className="cr-btn cr-btn--primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting…' : 'Submit'}
                </button>
            )}
        </div>
    );

    // ── Step 0: Identity ────────────────────────────────────────────────────

    const renderStep0 = () => (
        <div key="step-0" className="cr-step-content">
            <h2 className="cr-step-title">Identity</h2>

            <div className="cr-field">
                <label className="cr-label">Company Name <span className="cr-required">*</span></label>
                <input
                    className={`cr-input${errors.name ? ' cr-input--error' : ''}`}
                    type="text"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Twinpin Events Ltd."
                    autoFocus
                />
                {errors.name && <span className="cr-error">{errors.name}</span>}
            </div>

            <div className="cr-field">
                <label className="cr-label">Slug (URL) <span className="cr-required">*</span></label>
                <input
                    className={`cr-input${errors.slug ? ' cr-input--error' : ''}`}
                    type="text"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="my-cool-company"
                />
                <span className="cr-slug-preview">
                    twinpin.com/company/<span className="cr-slug-value">{form.slug || '…'}</span>
                </span>
                {errors.slug && <span className="cr-error">{errors.slug}</span>}
            </div>

            <div className="cr-upload-row">
                <div className="cr-field cr-field--logo">
                    <label className="cr-label">Logo</label>
                    <div
                        className="cr-upload-zone cr-upload-zone--square"
                        onClick={() => logoInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && logoInputRef.current?.click()}
                    >
                        {logoPreview ? (
                            <img className="cr-upload-preview" src={logoPreview} alt="Logo preview" />
                        ) : (
                            <div className="cr-upload-placeholder">
                                <IconCamera size={26} />
                                <span>Upload Logo</span>
                                <span className="cr-upload-hint">Square image</span>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        style={{ display: 'none' }}
                        onChange={handleLogoChange}
                    />
                </div>

                <div className="cr-field cr-field--cover">
                    <label className="cr-label">Cover Photo</label>
                    <div
                        className="cr-upload-zone cr-upload-zone--cover"
                        onClick={() => coverInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && coverInputRef.current?.click()}
                    >
                        {coverPreview ? (
                            <img className="cr-upload-preview" src={coverPreview} alt="Cover preview" />
                        ) : (
                            <div className="cr-upload-placeholder">
                                <IconCamera size={26} />
                                <span>Upload Cover</span>
                                <span className="cr-upload-hint">Banner image (16:6)</span>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={coverInputRef}
                        style={{ display: 'none' }}
                        onChange={handleCoverChange}
                    />
                </div>
            </div>
        </div>
    );

    // ── Step 1: About ───────────────────────────────────────────────────────

    const renderStep1 = () => (
        <div key="step-1" className="cr-step-content">
            <h2 className="cr-step-title">About</h2>

            <div className="cr-field">
                <label className="cr-label">Full Description</label>
                <textarea
                    className="cr-textarea"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={8}
                    placeholder="Describe your company's history, mission, and what makes it unique…"
                />
            </div>

            <div className="cr-field">
                <label className="cr-label">Activity Categories <span className="cr-required">*</span></label>
                <div className="cr-chips">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={`cr-chip${form.categories.includes(cat) ? ' cr-chip--selected' : ''}`}
                            onClick={() => toggleCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                {errors.categories && <span className="cr-error">{errors.categories}</span>}
            </div>
        </div>
    );

    // ── Step 2: Contact & Links ──────────────────────────────────────────────

    const renderStep2 = () => (
        <div key="step-2" className="cr-step-content">
            <h2 className="cr-step-title">Contact &amp; Links</h2>

            <div className="cr-field">
                <label className="cr-label">Website</label>
                <div className="cr-input-icon-wrap">
                    <span className="cr-input-icon"><IconGlobe size={15} /></span>
                    <input
                        className={`cr-input cr-input--with-icon${errors.website ? ' cr-input--error' : ''}`}
                        type="url"
                        value={form.website}
                        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                        placeholder="https://yourcompany.com"
                    />
                </div>
                {errors.website && <span className="cr-error">{errors.website}</span>}
            </div>

            <div className="cr-field">
                <label className="cr-label">Public Email</label>
                <input
                    className={`cr-input${errors.email ? ' cr-input--error' : ''}`}
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="hello@yourcompany.com"
                />
                {errors.email && <span className="cr-error">{errors.email}</span>}
            </div>

            <div className="cr-field">
                <label className="cr-label">Physical Address</label>
                <div className="cr-input-icon-wrap">
                    <span className="cr-input-icon"><IconMapPin size={15} /></span>
                    <input
                        ref={addressInputRef}
                        className="cr-input cr-input--with-icon"
                        type="text"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Start typing an address…"
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="cr-section-divider">Social Links</div>

            <div className="cr-social-grid">
                {SOCIAL_FIELDS.map(s => (
                    <div className="cr-field" key={s.key}>
                        <label className="cr-label">{s.label}</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon">{s.icon}</span>
                            <input
                                className="cr-input cr-input--with-icon"
                                type="url"
                                value={form[s.key] as string}
                                onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                                placeholder={s.placeholder}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ── Step 3: Review ──────────────────────────────────────────────────────

    const renderStep3 = () => {
        const contactRows: [string, string][] = [
            ['Website',   form.website],
            ['Email',     form.email],
            ['Address',   form.address],
            ['LinkedIn',  form.linkedin],
            ['Instagram', form.instagram],
            ['TikTok',    form.tiktok],
            ['Telegram',  form.telegram],
        ].filter(([, v]) => v) as [string, string][];

        return (
            <div key="step-3" className="cr-step-content">
                <h2 className="cr-step-title">Review</h2>
                <p className="cr-review-hint">Please review your details before submitting.</p>

                <div className="cr-review">
                    {/* Media */}
                    <div className="cr-review-media">
                        {coverPreview ? (
                            <img className="cr-review-cover" src={coverPreview} alt="Cover" />
                        ) : (
                            <div className="cr-review-cover-placeholder" />
                        )}
                        <div className="cr-review-logo-wrap">
                            {logoPreview ? (
                                <img className="cr-review-logo" src={logoPreview} alt="Logo" />
                            ) : (
                                <div className="cr-review-logo-placeholder">
                                    <IconBuilding size={28} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identity */}
                    <div className="cr-review-section">
                        <h3 className="cr-review-section-title">Identity</h3>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Name</span>
                            <span className="cr-review-value">{form.name}</span>
                        </div>
                        <div className="cr-review-row">
                            <span className="cr-review-label">URL</span>
                            <span className="cr-review-value cr-review-value--mono">
                                twinpin.com/company/<span className="cr-slug-value">{form.slug}</span>
                            </span>
                        </div>
                    </div>

                    {/* About */}
                    <div className="cr-review-section">
                        <h3 className="cr-review-section-title">About</h3>
                        <div className="cr-review-row">
                            <span className="cr-review-label">Categories</span>
                            <div className="cr-chips cr-chips--compact">
                                {form.categories.map(c => (
                                    <span key={c} className="cr-chip cr-chip--selected cr-chip--sm">{c}</span>
                                ))}
                            </div>
                        </div>
                        {form.description && (
                            <div className="cr-review-row cr-review-row--block">
                                <span className="cr-review-label">Description</span>
                                <p className="cr-review-description">{form.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Contact */}
                    {contactRows.length > 0 && (
                        <div className="cr-review-section">
                            <h3 className="cr-review-section-title">Contact &amp; Links</h3>
                            {contactRows.map(([label, val]) => (
                                <div className="cr-review-row" key={label}>
                                    <span className="cr-review-label">{label}</span>
                                    <span className="cr-review-value">{val}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

    return (
        <div className="company-register-page">
            <Header />
            <div className="company-register-container">
                <h1 className="company-register-heading">Register your company</h1>
                {renderStepIndicator()}
                <div className="company-register-card">
                    {stepRenderers[step]()}
                    {renderNav()}
                </div>
            </div>
        </div>
    );
};