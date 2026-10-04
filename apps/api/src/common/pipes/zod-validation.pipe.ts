import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common"
import type { ZodType } from "zod"

/**
 * Validates request payloads against a Zod schema. Zod is already the
 * validation idiom of the existing web app, so contracts stay uniform.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("؛ ")
      throw new BadRequestException(message || "ساختار درخواست معتبر نیست.")
    }
    return result.data
  }
}
