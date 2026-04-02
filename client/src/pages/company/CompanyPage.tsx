import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    addCompanyMember,
    getCompanyMembers,
    getMyCompany,
    removeMember,
    type Company,
    type CompanyMember,
} from '../../services/company';
import '../../styles/company-page.css';
import '../../styles/company-register.css';

export const CompanyPage: React.FC = () => {
    const [company, setCompany] = useState<Company | null>(null);
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getMyCompany()
            .then(async (c) => {
                setCompany(c);
                const list = await getCompanyMembers(c.id);
                setMembers(list);
            })
            .catch(() => setCompany(null))
            .finally(() => setLoading(false));
    }, []);

    const hasContact = useMemo(() => {
        if (!company) return false;
        return Boolean(company.website || company.email || company.address);
    }, [company]);

    const handleAddMember = async () => {
        if (!company) return;
        if (!inviteEmail.trim()) return;
        setInviteLoading(true);
        try {
            const created = await addCompanyMember(company.id, inviteEmail.trim());
            setMembers((prev) => [...prev, created]);
            setInviteEmail('');
            toast.success('Member invited');
        } catch {
            toast.error('Failed to invite member');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!company) return;
        try {
            await removeMember(company.id, memberId);
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            toast.success('Member removed');
        } catch {
            toast.error('Failed to remove member');
        }
    };

    if (loading) {
        return (
            <div className="cp-page">
                <Header />
                <div className="cp-layout">
                    <div className="cp-main">
                        <p>Loading company...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="cp-page">
                <Header />
                <div className="cp-layout">
                    <div className="cp-main">
                        <h1 className="cp-section-title">No registered company</h1>
                        <p>Create one to start publishing events.</p>
                        <Link className="cp-create-btn" to="/company/register">
                            Register company
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-page">
            <Header />

            <div className="cp-cover" style={company.coverUrl ? { backgroundImage: `url(${company.coverUrl})` } : undefined}>
                <div className="cp-cover-overlay" />
            </div>

            <div className="cp-identity-strip">
                <div className="cp-identity-inner">
                    <div className="cp-logo-wrap">
                        {company.logoUrl ? (
                            <img className="cp-logo" src={company.logoUrl} alt={`${company.name} logo`} />
                        ) : (
                            <div className="cp-logo-placeholder" />
                        )}
                    </div>

                    <div className="cp-identity-info">
                        <h1 className="cp-company-name">{company.name}</h1>
                        <div className="cp-categories">
                            {company.categories?.map((cat) => (
                                <span key={cat} className="cr-chip cr-chip--selected cr-chip--sm">
                                    {cat}
                                </span>
                            ))}
                        </div>
                        <div className="cp-stats">
                            <span>{company.stats?.eventsCreated ?? 0} events</span>
                            <span>{company.stats?.totalAttendees ?? 0} attendees</span>
                        </div>
                    </div>

                    <div className="cp-identity-actions">
                        <Link to="/events/create" className="cp-create-btn">
                            Create Event
                        </Link>
                        <Link to="/company/edit" className="cp-edit-btn">
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            <div className="cp-layout">
                <main className="cp-main">
                    <section className="cp-section">
                        <h2 className="cp-section-title">About</h2>
                        {company.description ? (
                            <p className="cp-description">{company.description}</p>
                        ) : (
                            <p className="cp-description cp-description--empty">No description provided yet.</p>
                        )}
                        {hasContact && (
                            <div className="cp-contact">
                                {company.website && (
                                    <p>
                                        <strong>Website:</strong> {company.website}
                                    </p>
                                )}
                                {company.address && (
                                    <p>
                                        <strong>Address:</strong> {company.address}
                                    </p>
                                )}
                                {company.email && (
                                    <p>
                                        <strong>Email:</strong> {company.email}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="cp-section">
                        <div className="cp-members-header">
                            <h2 className="cp-section-title" style={{ marginBottom: 0 }}>
                                Members
                            </h2>
                        </div>

                        <div className="cp-member-invite">
                            <input
                                className="cr-input"
                                value={inviteEmail}
                                placeholder="colleague@email.com"
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <button className="cr-btn cr-btn--primary" onClick={handleAddMember} disabled={inviteLoading}>
                                Invite
                            </button>
                        </div>

                        <div className="cp-member-list">
                            {members.map((m) => (
                                <div key={m.id} className="cp-member-row">
                                    <div className="cp-member-avatar">{m.name?.charAt(0)?.toUpperCase()}</div>
                                    <div className="cp-member-info">
                                        <div className="cp-member-name">{m.name}</div>
                                        <div className="cp-member-email">{m.email}</div>
                                    </div>
                                    <button className="cp-member-remove" onClick={() => handleRemoveMember(m.id)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {members.length === 0 && <p>No members yet.</p>}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

