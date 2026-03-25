"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean);
    app.enableCors({
        origin: configuredOrigins.length > 0
            ? configuredOrigins
            : ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true
    });
    const swaggerEnabled = (process.env.SWAGGER_ENABLED ?? "true").toLowerCase() === "true";
    if (swaggerEnabled) {
        const swaggerPath = process.env.SWAGGER_PATH ?? "docs";
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle("Attendance API")
            .setDescription("API documentation for Attendance backend")
            .setVersion("1.0")
            .addCookieAuth("attendance_token", {
            type: "apiKey",
            in: "cookie"
        }, "cookieAuth")
            .addBearerAuth({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
        }, "jwt")
            .build();
        const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
            swaggerOptions: {
                persistAuthorization: true
            }
        });
    }
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map