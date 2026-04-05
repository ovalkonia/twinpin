import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

export type SimulatedPaymentResult = {
  paymentIntentId: string;
  status: 'succeeded' | 'failed';
};

@Injectable()
export class StripePaymentSimulationService {
  private readonly logger = new Logger(StripePaymentSimulationService.name);

  async chargeForEvent(input: {
    userId: number;
    eventId: string;
    amount: number;
    currency: string;
  }): Promise<SimulatedPaymentResult> {
    this.logger.debug(
      `Simulating Stripe checkout: user=${input.userId} event=${input.eventId} amount=${input.amount} ${input.currency}`,
    );
    await new Promise((r) => setTimeout(r, 40));
    const paymentIntentId = `pi_sim_${randomBytes(10).toString('hex')}`;
    return { paymentIntentId, status: 'succeeded' };
  }
}
