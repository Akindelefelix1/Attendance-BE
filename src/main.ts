import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      configuredOrigins.length > 0
        ? configuredOrigins
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
