import { Injectable, Logger } from "@nestjs/common"
import { env } from "@/config/env"
import { BadGatewayError, PaymentRequiredError } from "@/common/errors/domain.errors"

/**
 * Port: any PSP can be implemented behind this interface without touching
 * order logic (docs/02 §11 — provider abstraction).
 */
export interface PaymentGatewayPort {
  request(input: {
    amountRial: number
    description: string
    callbackUrl: string
  }): Promise<{ authority: string }>
  verify(input: {
    authority: string
    amountRial: number
  }): Promise<{ refId: number }>
}

@Injectable()
export class ZarinpalGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(ZarinpalGateway.name)

  private async gateway(method: string, payload: Record<string, unknown>) {
    let response: Response
    try {
      response = await fetch(
        `https://api.zarinpal.com/pg/v4/payment/${method}.json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_id: env().ZARINPAL_MERCHANT_ID,
            ...payload,
          }),
          signal: AbortSignal.timeout(15000),
        }
      )
    } catch (error) {
      this.logger.warn(`zarinpal ${method} network failure`, error as Error)
      throw new BadGatewayError(
        "درگاه پاسخ معتبر نداد. وضعیت سفارش را دوباره بررسی کنید."
      )
    }
    if (!response.ok) {
      throw new BadGatewayError(
        "درگاه پاسخ معتبر نداد. وضعیت سفارش را دوباره بررسی کنید."
      )
    }
    return response.json() as Promise<{
      data?: { code: number; authority?: string; ref_id?: number }
      errors?: unknown
    }>
  }

  async request(input: {
    amountRial: number
    description: string
    callbackUrl: string
  }) {
    const result = await this.gateway("request", {
      amount: input.amountRial,
      description: input.description,
      callback_url: input.callbackUrl,
    })
    if (result.data?.code !== 100 || !result.data.authority) {
      throw new BadGatewayError("درگاه درخواست را نپذیرفت.")
    }
    return { authority: result.data.authority }
  }

  async verify(input: { authority: string; amountRial: number }) {
    const result = await this.gateway("verify", {
      authority: input.authority,
      amount: input.amountRial,
    })
    const code = result.data?.code
    const refId = result.data?.ref_id
    if (![100, 101].includes(code ?? 0) || !refId) {
      throw new PaymentRequiredError("پرداخت تأیید نشد.")
    }
    return { refId }
  }
}

export const PAYMENT_GATEWAY = Symbol("PAYMENT_GATEWAY")
