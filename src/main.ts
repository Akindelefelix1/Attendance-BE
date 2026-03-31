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
      .setTitle("Attendance Management API")
      .setDescription(
        "Comprehensive API documentation for the Attendance Management backend system. " +
        "This API provides endpoints for managing staff attendance, organizations, analytics, " +
        "disposable attendance forms, public holidays, and system administration."
      )
      .setVersion("1.0.0")
      .setContact(
        "Support",
        "https://example.com",
        "support@example.com"
      )
      .setLicense(
        "UNLICENSED",
        ""
      )
      .addServer("http://localhost:3000", "Development Server")
      .addServer(process.env.API_URL || "https://api.example.com", "Production Server")
      .addCookieAuth(
        "attendance_token",
        {
          type: "apiKey",
          in: "cookie",
          description: "JWT token stored in httpOnly cookie for persistent authentication"
        },
        "cookieAuth"
      )
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token for API authentication"
        },
        "jwt"
      )
      .addTag("System", "System health and status endpoints")
      .addTag("Auth", "Authentication and authorization endpoints")
      .addTag("Organizations", "Organization management endpoints")
      .addTag("Staff", "Staff member management endpoints")
      .addTag("Attendance", "Attendance tracking and records endpoints")
      .addTag("Analytics", "Analytics and reporting endpoints")
      .addTag("Disposable Attendance", "Disposable/custom attendance form endpoints")
      .addTag("Public Holidays", "Public holiday management endpoints")
      .addTag("Settings", "Organization settings management endpoints")
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        filter: true,
        showRequestHeaders: true,
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"]
      },
      customCss: ".swagger-ui .topbar { display: none }"
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
