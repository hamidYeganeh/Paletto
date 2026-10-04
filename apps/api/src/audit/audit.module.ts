import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import {
  AuditEntry,
  AuditSchema,
} from "./schemas/session.schema"
import { AuditService } from "./audit.service"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditEntry.name, schema: AuditSchema },
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
