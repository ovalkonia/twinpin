import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    getMyCompany,
    updateCompany,
    type Company,
} from '../../services/company';
import {
    IconCamera,
    IconClose,
    IconGlobe,
    IconInstagram,
    IconLinkedIn,
    IconMapPin,
    IconTelegram,
    IconTikTok,
} from '../../assets/icons';
import '../../styles/company-register.css';
import '../../styles/company-edit.css';
import '../../styles/create-event.css';

const SOCIAL_FIELDS = [
    { key: 'linkedin',  label: 'LinkedIn',  icon: <IconLinkedIn size={15} />,  placeholder: 'https://linkedin.com/company/...' },
    { key: 'instagram', label: 'Instagram', icon: <IconInstagram size={15} />, placeholder: 'https://instagram.com/...' },
    { key: 'tiktok',    label: 'TikTok',    icon: <IconTikTok size={15} />,    placeholder: 'https://tiktok.com/@...' },
    { key: 'telegram',  label: 'Telegram',  icon: <IconTelegram size={15} />,  placeholder: 'https://t.me/...' },
];

interface FormState {
    name: string;
    slug: string;
    description: string;
    categories: string[];
    website: string;
    email: string;
    address: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    telegram: string;
    logoFile: File | null;
    coverFile: File | null;
}

const INITIAL: FormState = {
    name: '',
    slug: '',
    description: '',
    categories: [],
    website: '',
    email: '',
    address: '',
    linkedin: '',
    instagram: '',
    tiktok: '',
    telegram: '',
    logoFile: null,
    coverFile: null,
};

export const EditCompanyPage: React.FC = () => {
    const navigate = useNavigate();

    const [company, setCompany] = useState<Company | null>(null);
    const [form, setForm] = useState<FormState>(INITIAL);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const addTag = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        setForm(f => {
            if (f.categories.some(t => t.toLowerCase() === trimmed.toLowerCase())) return f;
            return { ...f, categories: [...f.categories, trimmed] };
        });
        setErrors(prev => ({ ...prev, categories: '' }));
    };

    const removeTag = (tag: string) => {
        setForm(f => ({ ...f, categories: f.categories.filter(t => t !== tag) }));
    };

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const logoInputRef    = useRef<HTMLInputElement>(null);
    const coverInputRef   = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        getMyCompany()
            .then((c) => {
                setCompany(c);
                setForm({
                    name: c.name,
                    slug: c.slug,
                    description: c.description,
                    categories: [...c.categories],
                    website: c.website,
                    email: c.email,
                    address: c.address,
                    linkedin: c.linkedin,
                    instagram: c.instagram,
                    tiktok: c.tiktok,
                    telegram: c.telegram,
                    logoFile: null,
                    coverFile: null,
                });
                setLogoPreview(c.logoUrl);
                setCoverPreview(c.coverUrl);
            })
            .catch(() => {
                toast.error('Failed to load company');
            });
    }, []);

    useEffect(() => {
        return () => {
            // Revoke local previews only.
            if (form.logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
            if (form.coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logoPreview, coverPreview]);

    const slugPreview = useMemo(() => (form.slug ? form.slug : '...'), [form.slug]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Company name is required.';
        if (!form.slug.trim()) e.slug = 'Slug is required.';
        else if (form.slug.length < 3) e.slug = 'Slug must be at least 3 characters.';
        else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(form.slug)) e.slug = 'Invalid slug format.';
        if (form.categories.length === 0) e.categories = 'Select at least one category.';
        if (form.website && !/^https?:\/\/.+\..+/.test(form.website)) e.website = 'Enter a valid website URL.';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
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
                logo: form.logoFile ?? undefined,
                cover: form.coverFile ?? undefined,
            };

            if (!company) throw new Error('Missing company');
            await updateCompany(company.id, payload);
            toast.success('Changes saved.');
            navigate('/company');
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to save company');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (logoPreview && form.logoFile) URL.revokeObjectURL(logoPreview);
        setForm((f) => ({ ...f, logoFile: file }));
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (coverPreview && form.coverFile) URL.revokeObjectURL(coverPreview);
        setForm((f) => ({ ...f, coverFile: file }));
        setCoverPreview(URL.createObjectURL(file));
    };

    if (!company) {
        return (
            <div className="ce-page">
                <Header />
                <div className="ce-container">
                    <p>Loading company...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ce-page">
            <Header />
            <div className="ce-container">
                <div className="ce-header">
                    <h1 className="ce-heading">Edit Company Profile</h1>
                </div>

                <div className="cr-card">
                    <div className="cr-field">
                        <label className="cr-label">Company Name <span className="cr-required">*</span></label>
                        <input
                            className={`cr-input${errors.name ? ' cr-input--error' : ''}`}
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                        {errors.name && <span className="cr-error">{errors.name}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Slug <span className="cr-required">*</span></label>
                        <input
                            className={`cr-input${errors.slug ? ' cr-input--error' : ''}`}
                            value={form.slug}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                }))
                            }
                        />
                        <div className="cr-slug-preview">
                            twinpin.com/company/<span className="cr-slug-value">{slugPreview}</span>
                        </div>
                        {errors.slug && <span className="cr-error">{errors.slug}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Description</label>
                        <textarea
                            className="cr-textarea"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Tags</label>
                        {form.categories.length > 0 && (
                            <div className="cr-chips ev-tag-list">
                                {form.categories.map(tag => (
                                    <span key={tag} className="cr-chip cr-chip--selected ev-tag">
                                        {tag}
                                        <button
                                            type="button"
                                            className="ev-tag-remove"
                                            onClick={() => removeTag(tag)}
                                            aria-label={`Remove ${tag}`}
                                        >
                                            <IconClose size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <input
                            className={`cr-input${errors.categories ? ' cr-input--error' : ''}`}
                            placeholder="e.g. Music, Tech, Outdoor… (Enter or comma to add)"
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
                        {errors.categories && <span className="cr-error">{errors.categories}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Website</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon"><IconGlobe size={15} /></span>
                            <input
                                className={`cr-input cr-input--with-icon${errors.website ? ' cr-input--error' : ''}`}
                                type="url"
                                value={form.website}
                                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
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
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="hello@yourcompany.com"
                        />
                        {errors.email && <span className="cr-error">{errors.email}</span>}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Address / Location</label>
                        <div className="cr-input-icon-wrap">
                            <span className="cr-input-icon"><IconMapPin size={15} /></span>
                            <input
                                ref={addressInputRef}
                                className={`cr-input cr-input--with-icon${errors.address ? ' cr-input--error' : ''}`}
                                value={form.address}
                                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                placeholder="Start typing an address…"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="cr-section-divider">Social Links</div>
                    <div className="cr-social-grid">
                        {SOCIAL_FIELDS.map((s) => (
                            <div className="cr-field" key={s.key}>
                                <label className="cr-label">{s.label}</label>
                                <div className="cr-input-icon-wrap">
                                    <span className="cr-input-icon">{s.icon}</span>
                                    <input
                                        className="cr-input cr-input--with-icon"
                                        type="url"
                                        value={form[s.key as keyof FormState] as string}
                                        onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                                        placeholder={s.placeholder}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Logo</label>
                        <div
                            className="cr-upload-zone cr-upload-zone--square"
                            onClick={() => logoInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
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
                            {form.logoFile && (
                                <button
                                    type="button"
                                    className="cr-upload-clear"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setForm((f) => ({ ...f, logoFile: null }));
                                        setLogoPreview(company.logoUrl);
                                    }}
                                    aria-label="Remove logo"
                                >
                                    <IconClose size={14} />
                                </button>
                            )}
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoChange}
                        />
                    </div>

                    <div className="cr-field">
                        <label className="cr-label">Cover</label>
                        <div
                            className="cr-upload-zone ev-cover-zone"
                            onClick={() => coverInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                        >
                            {coverPreview ? (
                                <img className="cr-upload-preview" src={coverPreview} alt="Cover" />
                            ) : (
                                <div className="cr-upload-placeholder">
                                    <IconCamera size={28} />
                                    <span>Upload Cover</span>
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

                    <div className="cr-actions">
                        <button
                            className="cr-btn cr-btn--primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/company')}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

