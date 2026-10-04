import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { MongooseModule } from "@nestjs/mongoose"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { env } from "@/config/env"
import {
  Session,
  SessionSchema,
} from "@/audit/schemas/session.schema"
import { User, UserSchema } from "@/users/schemas/user.schema"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: env().JWT_SECRET,
        signOptions: {
          expiresIn: env().JWT_EXPIRES_IN as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
