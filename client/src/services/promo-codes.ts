import api from './api';

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  validUntil: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

export interface CreatePromoCodeDto {
  code: string;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  validUntil?: string;
  maxUses?: number;
}

export const createPromoCode = (eventId: string, dto: CreatePromoCodeDto): Promise<PromoCode> =>
  api.post(`/events/${eventId}/promo-codes`, dto).then((r) => r.data);

export const getPromoCodesForEvent = (eventId: string): Promise<PromoCode[]> =>
  api.get(`/events/${eventId}/promo-codes`).then((r) => r.data);

export const deletePromoCode = (eventId: string, id: string): Promise<void> =>
  api.delete(`/events/${eventId}/promo-codes/${id}`).then((r) => r.data);