import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreatePaymentDto } from './dto/create-payment.dto'
import Stripe from 'stripe'
import { TicketsService } from '../tickets/tickets.service'

@Injectable()
export class PaymentsService {
  private stripe: Stripe

  constructor(
    private configService: ConfigService,
    private ticketsService: TicketsService
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY')
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not defined')

    this.stripe = new Stripe(apiKey)
  }

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentDto, userId: number) {
    const amountInCents = createPaymentIntentDto.amount * 100

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: createPaymentIntentDto.currency,
      payment_method_types: ['card'],
      metadata: {
        eventId: createPaymentIntentDto.eventId.toString(),
        userId: userId.toString()
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined')

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret 
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const eventId = paymentIntent.metadata.eventId
      const userId = paymentIntent.metadata.userId
      
      await this.ticketsService.updateStatus(Number(eventId), Number(userId), 'paid')
      console.log(`Payment succeeded for event ${eventId}, user ${userId}`)
    }

    return { received: true }
  }
}