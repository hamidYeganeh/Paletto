import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common"
import { z } from "zod"
import { EntitiesService } from "./entities.service"
import { RolesGuard } from "@/common/guards"
import { Roles } from "@/common/guards/roles.guard"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"
import { EntityType } from "@/catalog/schemas/entity.schemas"
import { taxonomy } from "@/users/taxonomy"

const text = z.string().trim().min(2).max(300)
const objectId = z.string().regex(/^[a-f\d]{24}$/i)

const commonSchema = z.object({
  title: text,
  description: z.string().trim().min(10).max(6000),
  image: z
    .string()
    .max(1500)
    .refine(
      (v) =>
        /^\/(?:images|api\/media)\/[a-zA-Z0-9._/-]+$/.test(v) ||
        /^https:\/\/[^\s]+$/.test(v),
      "نشانی تصویر باید HTTPS یا تصویر محلی باشد"
    ),
  city: text,
  medium: z.enum(taxonomy.medium),
})

const gallerySchema = commonSchema.extend({
  kind: z.enum(taxonomy.gallery),
  opensAt: z
    .string()
    .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  closesAt: z
    .string()
    .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  closedDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  address: text,
  hours: text,
  accessibility: text,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

const eventSchema = commonSchema
  .extend({
    kind: z.enum(taxonomy.event),
    galleryId: objectId,
    admission: z.enum(["open", "free", "paid"]),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    capacity: z.number().int().min(1).max(100000),
    price: z.number().int().min(0).max(100000000),
    refundHours: z.number().int().min(0).max(720),
  })
  .refine((v) => v.endsAt > v.startsAt, "پایان باید بعد از شروع باشد")
  .refine(
    (v) => v.admission !== "paid" || v.price > 0,
    "قیمت بلیت را وارد کنید"
  )

const artworkSchema = commonSchema
  .extend({
    artistName: text,
    style: z.enum(taxonomy.style),
    technique: text,
    dimensions: text,
    year: text,
    price: z.number().int().min(0).max(100000000000),
    stock: z.number().int().min(1).max(1000),
    availability: z.enum(["sale", "inquiry", "display"]),
    galleryId: objectId,
  })
  .refine(
    (v) => v.availability !== "sale" || v.price > 0,
    "قیمت فروش لازم است"
  )

const schemas = {
  galleries: gallerySchema,
  events: eventSchema,
  artworks: artworkSchema,
} as const

const submitSchema = z.object({
  type: z.enum(["galleries", "events", "artworks"]),
  id: objectId.optional(),
  data: z.unknown(),
})

const moderateSchema = z.object({
  type: z.enum(["galleries", "events", "artworks"]),
  id: objectId,
  status: z.enum(["published", "rejected"]),
  note: z.string().max(2000).default(""),
})

@Controller("entities")
@UseGuards(RolesGuard)
export class EntitiesController {
  constructor(private readonly entities: EntitiesService) {}

  @Post()
  async submit(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(submitSchema))
    body: z.infer<typeof submitSchema>
  ) {
    const actor = { id: String(user._id), role: user.role }
    // Parse with the schema selected by `type` so each entity type gets
    // its own field set and refinements.
    const data = schemas[body.type].parse(body.data) as Record<string, unknown>
    const galleryId =
      body.type !== "galleries" && typeof data.galleryId === "string"
        ? data.galleryId
        : undefined
    if (galleryId) {
      await this.entities.assertGalleryAssignable(actor, galleryId)
    }
    if (body.type === "events") {
      const startsAt = data.startsAt as string | undefined
      if (startsAt && new Date(startsAt).getTime() <= Date.now()) {
        // New events must start in the future; edits keep their schedule.
        if (!body.id) throw new Error("زمان رویداد باید در آینده باشد.")
      }
    }
    return this.entities.submit(actor, {
      type: body.type,
      id: body.id,
      data,
    })
  }

  @Post("moderate")
  @Roles("admin")
  moderate(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(moderateSchema))
    body: z.infer<typeof moderateSchema>
  ) {
    return this.entities.moderate(String(user._id), body)
  }

  @Get("pending")
  @Roles("admin")
  pending(@Query("type") type?: EntityType) {
    return this.entities.pendingQueue(type)
  }

  @Get("mine")
  mine(@CurrentUser() user: UserDocument) {
    return this.entities.mine({ id: String(user._id), role: user.role })
  }

  @Get(":type/:id")
  one(@Param("type") type: EntityType, @Param("id") id: string) {
    return this.entities.byId(type, id)
  }
}
