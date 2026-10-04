import { Logger, ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { env } from "./config/env"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.use(helmet())
  app.enableCors({
    origin: env().APP_ORIGIN,
    credentials: true,
  })
  app.setGlobalPrefix("api/v1", { exclude: ["health"] })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false })
  )
  app.enableShutdownHooks()

  const port = env().PORT
  await app.listen(port)
  new Logger("Bootstrap").log(`API listening on :${port} (prefix /api/v1)`)
}

void bootstrap()
