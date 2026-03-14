import { Controller, Post, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user,
  ) {
    return await this.paymentsService.createPaymentIntent(createPaymentDto, user.id)
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody
    return await this.paymentsService.handleWebhook(signature, rawBody)
  }
}