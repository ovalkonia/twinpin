import api from './api';

export const createPaymentIntent = (eventId: string, quantity: number) =>
    api.post<{ clientSecret: string }>('/payments/create-intent', { eventId, quantity });