import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    IconCamera,
    IconGlobe,
    IconInstagram,
    IconLinkedIn,
    IconMapPin,
    IconTelegram,
    IconTikTok,
} from '../../assets/icons';
import '../../styles/company-register.css';
import '../../styles/company-edit.css';

// ─── Mock data (same source as CompanyPage) ───────────────────────────────────

const MOCK_COMPANY = {
    name: 'Twinpin Events Ltd.',
    slug: 'twinpin-events',
    logoUrl: null as string | null,
    coverUrl: null as string | null,
    description:
        'We create unforgettable live experiences that bring people together.\n\n' +
        'Founded in 2021, Twinpin Events has grown from a small local organizer into ' +
        'a platform trusted by thousands of attendees across Ukraine and beyond. ' +
        'Our team is passionate about music, technology, and community — ' +
        'and every event we run reflects that energy.\n\n' +
        "Whether you're here for a sold-out tech summit or an intimate jazz night, " +
        'we promise an experience worth remembering.',
    categories: ['IT', 'Music', 'Art'],
    website: 'https://twinpin.com',
    email: 'hello@twinpin.com',
    address: 'Kyiv, Ukraine — Khreshchatyk St 22',
    linkedin: 'https://linkedin.com/company/twinpin',
    instagram: 'https://instagram.com/twinpin',
    tiktok: '',
    telegram: 'https://t.me/twinpin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['IT', 'Music', 'Charity', 'Sport', 'Art', 'Food', 'Business', 'Education'];

const SOCIAL_FIELDS: { key: string; label: string; placeholder: string; icon: React.ReactNode }[] = [
    { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/…', icon: <IconLinkedIn size={15} /> },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…',         icon: <IconInstagram size={15} /> },
    { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@…',            icon: <IconTikTok size={15} /> },
    { key: 'telegram',  label: 'Telegram',  placeholder: 'https://t.me/…',                   icon: <IconTelegram size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URL_RE = /^https?:\/\/.+\..+/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
    name: string;
    slug: string;
    logoFile: File | null;
    coverFile: File | null;
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

// ─── Component ────────────────────────────────────────────────────────────────

export const EditCompanyPage: React.FC = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({
        name:        MOCK_COMPANY.name,
        slug:        MOCK_COMPANY.slug,
        logoFile:    null,
        coverFile:   null,
        description: MOCK_COMPANY.description,
        categories:  [...MOCK_COMPANY.categories],
        website:     MOCK_COMPANY.website,
        email:       MOCK_COMPANY.email,
        address:     MOCK_COMPANY.address,
        linkedin:    MOCK_COMPANY.linkedin,
        instagram:   MOCK_COMPANY.instagram,
        tiktok:      MOCK_COMPANY.tiktok,
        telegram:    MOCK_COMPANY.telegram,
    });

    // Previews — start from existing URLs, replaced when user picks a new file
    const [logoPreview, setLogoPreview] = useState<string | null>(MOCK_COMPANY.logoUrl);
    const [coverPreview, setCoverPreview] = useState<string | null>(MOCK_COMPANY.coverUrl);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const logoInputRef  = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Revoke only object URLs (not the original remote URLs) on unmount
    useEffect(() => {
        return () => {
            if (form.logoFile  && logoPreview)  URL.revokeObjectURL(logoPreview);
            if (form.coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Field handlers ──────────────────────────────────────────────────────

    const set = (key: keyof FormState, value: unknown) =>
        setForm(f => ({ ...f, [key]: value }));

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (form.logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
        set('logoFile', file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (form.coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
        set('coverFile', file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const toggleCategory = (cat: string) =>
        setForm(f => ({
            ...f,
            categories: f.categories.includes(cat)
                ? f.categories.filter(c => c !== cat)
                : [...f.categories, cat],
        }));

    // ── Validation ──────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim())
            e.name = 'Company name is required.';
        if (!form.slug.trim())
            e.slug = 'Slug is required.';
        else if (form.slug.length < 3)
            e.slug = 'Slug must be at least 3 characters.';
        else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(form.slug))
            e.slug = 'Use only lowercase letters, numbers, and hyphens.';
        if (form.categories.length === 0)
            e.categories = 'Select at least one category.';
        if (form.website && !URL_RE.test(form.website))
            e.website = 'Enter a valid URL (http:// or https://).';
        if (form.email && !EMAIL_RE.test(form.email))
            e.email = 'Enter a valid email address.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ──────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            toast.success('Changes saved.');
            navigate('/company');
        } catch {
            toast.error('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="ce-page">
            <Header />
            <div className="ce-container">
                <div className="ce-header">
                    <h1 className="ce-heading">Edit Company Profile</h1>
                </div>

                {/* ── Identity ──────────────────────────────────── */}
                <div className="ce-card">
                    <h2 className="cr-step-title">Identity</h2>

                    <div className="cr-field">
                        <label className="cr-label">Company Name <span className="cr-required">*</span></label>
                        <input
                            className={`cr-input${errors.name ? ' cr-input--error' : ''}`}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                        />
                        {errors.name && <span className="cr-error">{errors.name}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Slug (URL) <span className="cr-required">*</span></label>
                        <input
                            className={`cr-input${errors.slug ? ' cr-input--error' : ''}`}
                            value={form.slug}
                            onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
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
                                    <img className="cr-upload-preview" src={logoPreview} alt="Logo" />
                                ) : (
                                    <div className="cr-upload-placeholder">
                                        <IconCamera size={26} />
                                        <span>Upload Logo</span>
                                        <span className="cr-upload-hint">Square image</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={handleLogoChange} />
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
                                    <img className="cr-upload-preview" src={coverPreview} alt="Cover" />
                                ) : (
                                    <div className="cr-upload-placeholder">
                                        <IconCamera size={26} />
                                        <span>Upload Cover</span>
                                        <span className="cr-upload-hint">Banner image (16:6)</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverChange} />
                        </div>
                    </div>
                </div>

                {/* ── About ─────────────────────────────────────── */}
                <div className="ce-card">
                    <h2 className="cr-step-title">About</h2>

                    <div className="cr-field">
                        <label className="cr-label">Full Description</label>
                        <textarea
                            className="cr-textarea"
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
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

                {/* ── Contact & Links ───────────────────────────── */}
                <div className="ce-card">
                    <h2 className="cr-step-title">Contact &amp; Links</h2>

                    <div className="cr-field">
                        <label className="cr-label">Website</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon"><IconGlobe size={15} /></span>
                            <input
                                className={`cr-input cr-input--with-icon${errors.website ? ' cr-input--error' : ''}`}
                                type="url"
                                value={form.website}
                                onChange={e => set('website', e.target.value)}
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
                            onChange={e => set('email', e.target.value)}
                            placeholder="hello@yourcompany.com"
                        />
                        {errors.email && <span className="cr-error">{errors.email}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Physical Address</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon"><IconMapPin size={15} /></span>
                            <input
                                className="cr-input cr-input--with-icon"
                                value={form.address}
                                onChange={e => set('address', e.target.value)}
                                placeholder="123 Main St, City, Country"
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
                                        value={form[s.key as keyof FormState] as string}
                                        onChange={e => set(s.key as keyof FormState, e.target.value)}
                                        placeholder={s.placeholder}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Actions ───────────────────────────────────── */}
                <div className="ce-actions">
                    <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/company')}>
                        Cancel
                    </button>
                    <button className="cr-btn cr-btn--primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};