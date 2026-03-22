import api from './api';

export const createPaymentIntent = (
    eventId: string,
    quantity: number,
    showInAttendees: boolean,
) => api.post<{ clientSecret: string }>('/payments/create-intent', {
    eventId,
    quantity,
    showInAttendees,
});

export const updateTicketVisibility = (ticketId: number, showInAttendees: boolean) =>
    api.patch(`/tickets/${ticketId}/visibility`, { showInAttendees });