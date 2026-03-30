"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const handlebars_1 = __importDefault(require("handlebars"));
let TemplateService = class TemplateService {
    templates = new Map();
    resolveTemplatePath(templateName) {
        const candidates = [
            (0, path_1.join)(__dirname, "templates", templateName),
            (0, path_1.resolve)(process.cwd(), "dist", "src", "notifications", "templates", templateName),
            (0, path_1.resolve)(process.cwd(), "src", "notifications", "templates", templateName)
        ];
        const matched = candidates.find((candidate) => (0, fs_1.existsSync)(candidate));
        if (!matched) {
            throw new Error(`Template not found: ${templateName}. Checked: ${candidates.join(", ")}`);
        }
        return matched;
    }
    loadTemplate(templateName) {
        const cached = this.templates.get(templateName);
        if (cached)
            return cached;
        const templatePath = this.resolveTemplatePath(templateName);
        const source = (0, fs_1.readFileSync)(templatePath, "utf-8");
        const template = handlebars_1.default.compile(source);
        this.templates.set(templateName, template);
        return template;
    }
    renderTemplate(templateName, data) {
        const template = this.loadTemplate(templateName);
        return template({
            ...data,
            year: new Date().getFullYear()
        });
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)()
], TemplateService);
//# sourceMappingURL=template.service.js.map