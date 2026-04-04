import api from './api';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface UserEvent {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    price: string;
    coverUrl?: string;
    attendeeCount?: number;
    capacity?: number | null;
}

export interface UserTicket {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    ticketCount: number;
    price?: string;
    currency?: string;
    coverUrl?: string;
}

export const getUserById = async (id: string): Promise<UserProfile> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const getUserEvents = async (userId: string): Promise<UserEvent[]> => {
    const response = await api.get(`/users/${userId}/events`);
    return response.data;
};

export const getUserTickets = async (userId: string): Promise<UserTicket[]> => {
    const response = await api.get(`/users/${userId}/tickets`);
    return response.data;
};

export const updateUser = async (
    userId: string,
    input: { name?: string; password?: string },
): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>(`/users/${userId}`, input);
    return response.data;
};

export const updateUserAvatar = async (
    userId: string,
    avatar: File,
): Promise<UserProfile> => {
    const fd = new FormData();
    fd.append('avatar', avatar);
    const response = await api.patch<UserProfile>(`/users/${userId}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};