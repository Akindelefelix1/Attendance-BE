import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  app.enableCors({
    origin:
      configuredOrigins.length > 0
        ? configuredOrigins
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  });

  const swaggerEnabled = (process.env.SWAGGER_ENABLED ?? "true").toLowerCase() === "true";
  if (swaggerEnabled) {
    const swaggerPath = process.env.SWAGGER_PATH ?? "docs";
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Attendance API")
      .setDescription("API documentation for Attendance backend")
      .setVersion("1.0")
      .addCookieAuth(
        "attendance_token",
        {
          type: "apiKey",
          in: "cookie"
        },
        "cookieAuth"
      )
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        "jwt"
      )
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true
      }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
