import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconMapPin } from '../../assets/icons';
import { getEvents, type Event, type EventsFilter } from '../../services/events';
import toast from 'react-hot-toast';
import './dashboard.css';

type ActiveFilters = Omit<EventsFilter, 'page' | 'limit'>;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
    { value: 'date-desc',  label: 'Newest first' },
    { value: 'date-asc',   label: 'Oldest first' },
    { value: 'price-asc',  label: 'Price: low → high' },
    { value: 'price-desc', label: 'Price: high → low' },
] as const;

export const MainPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const qParam = searchParams.get('q') ?? undefined;

    // ── Active (applied) filters ────────────────────────────────────────────
    const [filters, setFilters] = useState<ActiveFilters>({
        sortBy: 'date',
        sortOrder: 'desc',
        search: qParam,
    });

    // Sync URL ?q param → filters when it changes (e.g. header search)
    useEffect(() => {
        setFilters(prev => ({ ...prev, search: qParam }));
        setPage(1);
    }, [qParam]);
    const [page, setPage] = useState(1);

    // ── Events data ─────────────────────────────────────────────────────────
    const [events, setEvents] = useState<Event[]>([]);
    const [total, setTotal]   = useState(0);
    const [loading, setLoading] = useState(true);

    // ── Draft inputs (not yet applied) ──────────────────────────────────────
    const [categoryDraft, setCategoryDraft] = useState('');
    const [moreOpen, setMoreOpen]         = useState(false);
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [priceMin, setPriceMin]         = useState('');
    const [priceMax, setPriceMax]         = useState('');

    const moreHasActive = Boolean(
        filters.dateFrom || filters.dateTo ||
        filters.priceMin !== undefined || filters.priceMax !== undefined,
    );

    const morePanelRef = useRef<HTMLDivElement>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const goToPage = (p: number) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const pageNumbers = (): (number | '…')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 4)       return [1, 2, 3, 4, 5, '…', totalPages];
        if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '…', page - 1, page, page + 1, '…', totalPages];
    };

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        getEvents({ ...filters, page, limit: PAGE_SIZE })
            .then((res) => {
                setEvents(res.data);
                setTotal(res.total);
            })
            .catch((err) => {
                const msg = err?.response?.data?.message;
                toast.error(typeof msg === 'string' ? msg : 'Failed to load events');
                setEvents([]);
            })
            .finally(() => setLoading(false));
    }, [filters, page]);

    // ── Filter helpers ───────────────────────────────────────────────────────
    const applyFilter = (patch: Partial<ActiveFilters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
        setPage(1);
    };

    const applyCategory = () => {
        applyFilter({ category: categoryDraft.trim() || undefined });
    };

    const applyMore = () => {
        applyFilter({
            dateFrom:  dateFrom  || undefined,
            dateTo:    dateTo    || undefined,
            priceMin:  priceMin  ? Number(priceMin)  : undefined,
            priceMax:  priceMax  ? Number(priceMax)  : undefined,
        });
        setMoreOpen(false);
    };

    const clearAll = () => {
        setCategoryDraft('');
        setDateFrom('');
        setDateTo('');
        setPriceMin('');
        setPriceMax('');
        setMoreOpen(false);
        setFilters({ sortBy: 'date', sortOrder: 'desc' });
        setPage(1);
        navigate('/dashboard', { replace: true });
    };

    const handleSortChange = (value: string) => {
        const [sortBy, sortOrder] = value.split('-') as ['date' | 'price', 'asc' | 'desc'];
        applyFilter({ sortBy, sortOrder });
    };

    const sortValue = `${filters.sortBy ?? 'date'}-${filters.sortOrder ?? 'desc'}`;

    const hasAnyFilter = Boolean(
        qParam || filters.category || filters.format ||
        filters.dateFrom || filters.dateTo ||
        filters.priceMin !== undefined || filters.priceMax !== undefined,
    );

    // ── Display helpers ──────────────────────────────────────────────────────
    const gradientFor = useMemo(() => {
        const map: Record<string, string> = {
            Music:    'linear-gradient(135deg, #1a0a2e, #16213e)',
            Theatre:  'linear-gradient(135deg, #2e0a1a, #1a0a2e)',
            Tech:     'linear-gradient(135deg, #0a2e2e, #0a1a2e)',
            Sport:    'linear-gradient(135deg, #0a2e0a, #2e0a1a)',
            Art:      'linear-gradient(135deg, #2e1a0a, #2e0a0a)',
            Food:     'linear-gradient(135deg, #2e2a0a, #2e1a0a)',
            Business: 'linear-gradient(135deg, #0a2e2e, #0f0f0f)',
        };
        return (category: string) => map[category] ?? 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';
    }, []);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

    const priceLabel = (price: number) => (price === 0 ? 'Free' : `$${price}`);

    return (
        <div className="dashboard">
            <Header />

            <div className="dashboard-welcome">
                <h1 className="dashboard-greeting">
                    Welcome back, {user?.name || 'there'}!
                </h1>
                <p className="dashboard-subtitle">
                    Discover and book events happening near you
                </p>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">All Events</h2>
                    {total > 0 && !loading && (
                        <span className="dashboard-total">{total} event{total !== 1 ? 's' : ''}</span>
                    )}
                </div>

                {/* ── Filter bar ─────────────────────────────────────────── */}
                <div className="dash-filters">
                    {/* Category */}
                    <input
                        className="dash-filter-input dash-filter-category"
                        type="text"
                        placeholder="Category…"
                        value={categoryDraft}
                        onChange={e => setCategoryDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCategory()}
                        onBlur={applyCategory}
                    />

                    {/* Format */}
                    <select
                        className="dash-filter-select"
                        value={filters.format ?? ''}
                        onChange={e => applyFilter({ format: (e.target.value as 'online' | 'offline') || undefined })}
                    >
                        <option value="">All formats</option>
                        <option value="online">Online</option>
                        <option value="offline">In-person</option>
                    </select>

                    {/* Sort */}
                    <select
                        className="dash-filter-select"
                        value={sortValue}
                        onChange={e => handleSortChange(e.target.value)}
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* More filters */}
                    <div className="dash-more-wrap">
                        <button
                            className={`dash-filter-btn${moreHasActive ? ' dash-filter-btn--active' : ''}`}
                            onClick={() => setMoreOpen(o => !o)}
                        >
                            More filters {moreOpen ? '▴' : '▾'}
                        </button>

                        {moreOpen && (
                            <div className="dash-more-panel" ref={morePanelRef}>
                                <div className="dash-more-row">
                                    <label className="dash-more-label">Date from</label>
                                    <input
                                        className="dash-filter-input"
                                        type="date"
                                        value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="dash-more-row">
                                    <label className="dash-more-label">Date to</label>
                                    <input
                                        className="dash-filter-input"
                                        type="date"
                                        value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                    />
                                </div>
                                <div className="dash-more-row">
                                    <label className="dash-more-label">Min price ($)</label>
                                    <input
                                        className="dash-filter-input"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={priceMin}
                                        onChange={e => setPriceMin(e.target.value)}
                                    />
                                </div>
                                <div className="dash-more-row">
                                    <label className="dash-more-label">Max price ($)</label>
                                    <input
                                        className="dash-filter-input"
                                        type="number"
                                        min="0"
                                        placeholder="Any"
                                        value={priceMax}
                                        onChange={e => setPriceMax(e.target.value)}
                                    />
                                </div>
                                <div className="dash-more-actions">
                                    <button className="dash-more-apply" onClick={applyMore}>Apply</button>
                                    <button className="dash-more-clear" onClick={clearAll}>Clear all</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Clear badge when filters are active */}
                    {hasAnyFilter && (
                        <button className="dash-filter-clear" onClick={clearAll}>✕ Clear</button>
                    )}
                </div>

                {/* ── Events grid ────────────────────────────────────────── */}
                <div className="events-grid">
                    {!loading && events.length === 0 && (
                        <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                            No events found. Try adjusting your filters.
                        </p>
                    )}
                    {loading
                        ? null
                        : events.map((event) => (

                            <div
                                key={event.id}
                                className="event-card"
                                onClick={() => navigate(`/events/${event.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="event-card-image"
                                    style={
                                        event.coverUrl
                                            ? {
                                                backgroundImage: `url(${event.coverUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }
                                            : { background: gradientFor(event.category) }
                                    }
                                >
                                    <span className="event-card-category">
                                        {event.category}
                                    </span>
                                </div>
                                <div className="event-card-body">
                                    <div className="event-card-title">
                                        {event.title}
                                    </div>
                                    <div className="event-card-meta">
                                        <span className="event-card-meta-row">
                                            <IconCalendar size={12} />
                                            {formatDate(event.date)}
                                        </span>
                                        <span className="event-card-meta-row">
                                            <IconMapPin size={12} />
                                            {event.location ?? ''}
                                        </span>
                                    </div>
                                    <div className="event-card-footer">
                                        <span className="event-card-price">
                                            {priceLabel(event.price)}
                                        </span>
                                        <button
                                            className="event-card-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/events/${event.id}`);
                                            }}
                                        >
                                            Get Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                {/* ── Pagination ─────────────────────────────────────────── */}
                {totalPages > 1 && (
                    <div className="dash-pagination">
                        <button
                            className="dash-page-btn dash-page-btn--nav"
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1}
                        >
                            ‹
                        </button>

                        {pageNumbers().map((n, i) =>
                            n === '…'
                                ? <span key={`ellipsis-${i}`} className="dash-page-ellipsis">…</span>
                                : <button
                                    key={n}
                                    className={`dash-page-btn${page === n ? ' dash-page-btn--active' : ''}`}
                                    onClick={() => goToPage(n as number)}
                                >
                                    {n}
                                </button>
                        )}

                        <button
                            className="dash-page-btn dash-page-btn--nav"
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};