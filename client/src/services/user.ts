import api from './api';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
}

export interface UserEvent {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    price: string;
    coverUrl?: string;
}

export interface UserTicket {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    ticketCount: number;
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