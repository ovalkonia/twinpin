import api from './api';

export interface Company {
    id: string;
    name: string;
    slug: string;
    owner?: {
        id: string;
        name?: string;
    };
    logoUrl: string | null;
    coverUrl: string | null;
    description: string;
    categories: string[];
    website: string;
    email: string;
    address: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    telegram: string;
    stats: {
        eventsCreated: number;
        totalAttendees: number;
    };
}

export interface CompanyMember {
    id: string;
    name: string;
    email: string;
}

export interface RegisterCompanyInput {
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
    logo?: File;
    cover?: File;
}

export type UpdateCompanyInput = Partial<RegisterCompanyInput>;


function buildFormData(input: RegisterCompanyInput | UpdateCompanyInput): FormData {
    const fd = new FormData();

    (Object.keys(input) as (keyof typeof input)[]).forEach(key => {
        const value = input[key];
        if (value === undefined || value === null) return;

        if (key === 'categories' && Array.isArray(value)) {
            value.forEach(cat => fd.append('categories[]', cat));
        } else if (value instanceof File) {
            fd.append(key, value);
        } else {
            fd.append(key, String(value));
        }
    });

    return fd;
}

// ─── Company CRUD ─────────────────────────────────────────────────────────────

/** Register a new company for the current user. */
export const registerCompany = async (input: RegisterCompanyInput): Promise<Company> => {
    const response = await api.post<Company>('/companies', buildFormData(input), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/** Fetch the company that belongs to the current authenticated user. */
export const getMyCompany = async (): Promise<Company> => {
    const response = await api.get<Company>('/companies/my');
    return response.data;
};

/** Fetch any company by its slug (used for public profile pages). */
export const getCompanyBySlug = async (slug: string): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${slug}`);
    return response.data;
};

/** Update company fields. Only the provided fields are sent. */
export const updateCompany = async (id: string, input: UpdateCompanyInput): Promise<Company> => {
    const response = await api.patch<Company>(`/companies/${id}`, buildFormData(input), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// ─── Members ──────────────────────────────────────────────────────────────────

/** List all members of a company. */
export const getCompanyMembers = async (companyId: string): Promise<CompanyMember[]> => {
    const response = await api.get<CompanyMember[]>(`/companies/${companyId}/members`);
    return response.data;
};

/** Invite a new member by email. The server sends them an invitation. */
export const addCompanyMember = async (
    companyId: string,
    email: string,
): Promise<CompanyMember> => {
    const response = await api.post<CompanyMember>(`/companies/${companyId}/members`, { email });
    return response.data;
};

/** Remove a member from the company. */
export const removeMember = async (companyId: string, memberId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/members/${memberId}`);
};

// ─── Company follows ──────────────────────────────────────────────────────────

/** Follow a company to get notified about new events. */
export const followCompany = async (companyId: string): Promise<void> => {
    await api.post(`/companies/${companyId}/follow`);
};

/** Unfollow a company. */
export const unfollowCompany = async (companyId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/follow`);
};

/** Check whether the current user follows a company. */
export const getCompanyFollowStatus = async (companyId: string): Promise<boolean> => {
    const response = await api.get<{ following: boolean }>(`/companies/${companyId}/follow`);
    return response.data.following;
};