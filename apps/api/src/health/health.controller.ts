import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { InjectConnection } from "@nestjs/mongoose"
import { Connection } from "mongoose"
import { Public } from "@/common/decorators/public.decorator"

@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  check() {
    const ready = this.connection.readyState === 1
    if (!ready) {
      throw new ServiceUnavailableException("database not ready")
    }
    return { status: "ok", database: "up" }
  }
}
