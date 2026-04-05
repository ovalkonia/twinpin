import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/header';
import api from '../../services/api';

type ValidationResult = {
    status: 'ok' | 'already_used';
    eventTitle: string;
    holderName: string;
    usedAt: string;
};

export default function ValidateTicketPage() {
    const [searchParams] = useSearchParams();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runValidate = async (codeToValidate: string) => {
        const trimmed = codeToValidate.trim();
        if (!trimmed) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await api.post<ValidationResult>('/bookings/validate', { code: trimmed });
            setResult(res.data);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            setError(typeof msg === 'string' ? msg : 'Validation failed. Check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const urlCode = searchParams.get('code');
        if (urlCode) {
            setCode(urlCode);
            runValidate(urlCode);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        runValidate(code);
    };

    const reset = () => { setCode(''); setResult(null); setError(null); };

    const isValid = result?.status === 'ok';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
            <Header />
            <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px 60px' }}>

                {/* Header */}
                <div style={{ marginBottom: 36 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)',
                        borderRadius: 20, padding: '4px 12px', marginBottom: 16,
                    }}>
                        <span style={{ fontSize: 12, color: '#ff6b00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Organizer Tool
                        </span>
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
                        Ticket Scanner
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
                        Scan or paste a ticket code to verify and check in an attendee.
                    </p>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16,
                            padding: 24,
                            marginBottom: 16,
                        }}>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 700,
                                color: '#ff6b00', textTransform: 'uppercase',
                                letterSpacing: '0.1em', marginBottom: 10,
                            }}>
                                Ticket Code
                            </label>
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                autoFocus
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: '#0a0a0a', border: '1px solid rgba(255,107,0,0.2)',
                                    borderRadius: 10, padding: '13px 16px',
                                    fontSize: 13, color: '#e0e0e0', fontFamily: 'monospace',
                                    outline: 'none', letterSpacing: '0.02em',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.5)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,107,0,0.2)')}
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(231,76,60,0.08)',
                                border: '1px solid rgba(231,76,60,0.25)',
                                borderRadius: 12, padding: '13px 16px',
                                marginBottom: 16, fontSize: 14, color: '#e74c3c',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{ fontSize: 16 }}>✕</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            style={{
                                width: '100%', padding: '14px',
                                borderRadius: 12,
                                background: loading || !code.trim()
                                    ? 'rgba(255,107,0,0.15)'
                                    : 'linear-gradient(135deg, #ff6b00, #ff8c38)',
                                color: loading || !code.trim() ? '#555' : '#fff',
                                border: 'none', fontSize: 15, fontWeight: 700,
                                cursor: loading || !code.trim() ? 'default' : 'pointer',
                                letterSpacing: '0.02em',
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {loading ? 'Checking…' : 'Check In Attendee'}
                        </button>
                    </form>
                ) : (
                    <div>
                        {/* Status card */}
                        <div style={{
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: `1px solid ${isValid ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
                            marginBottom: 16,
                        }}>
                            {/* Status banner */}
                            <div style={{
                                background: isValid
                                    ? 'linear-gradient(135deg, rgba(39,174,96,0.25), rgba(39,174,96,0.1))'
                                    : 'linear-gradient(135deg, rgba(231,76,60,0.2), rgba(231,76,60,0.08))',
                                padding: '28px 28px 24px',
                                textAlign: 'center',
                                borderBottom: `1px solid ${isValid ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)'}`,
                            }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                                    background: isValid ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)',
                                    border: `2px solid ${isValid ? 'rgba(39,174,96,0.5)' : 'rgba(231,76,60,0.5)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {isValid ? (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: 20, fontWeight: 800,
                                    color: isValid ? '#2ecc71' : '#e74c3c',
                                    letterSpacing: '-0.2px',
                                }}>
                                    {isValid ? 'Checked In' : 'Already Used'}
                                </div>
                                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                                    {isValid ? 'Ticket is valid — entry granted' : 'This ticket was already scanned'}
                                </div>
                            </div>

                            {/* Details */}
                            <div style={{ background: '#0f0f0f', padding: '20px 28px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0, paddingTop: 1 }}>Event</span>
                                        <span style={{ fontSize: 14, color: '#e0e0e0', fontWeight: 600, textAlign: 'right' }}>{result.eventTitle}</span>
                                    </div>
                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Holder</span>
                                        <span style={{ fontSize: 14, color: '#e0e0e0', fontWeight: 600 }}>{result.holderName}</span>
                                    </div>
                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                                            {isValid ? 'Checked in' : 'Previously used'}
                                        </span>
                                        <span style={{ fontSize: 13, color: '#666' }}>
                                            {new Date(result.usedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={reset}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 12,
                                background: '#161616',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#aaa', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                transition: 'border-color 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,107,0,0.3)'; (e.target as HTMLButtonElement).style.color = '#e0e0e0'; }}
                            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.target as HTMLButtonElement).style.color = '#aaa'; }}
                        >
                            Scan Another Ticket
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
