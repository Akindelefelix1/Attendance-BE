import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import Handlebars from "handlebars";

type TemplateData = Record<string, any>;

@Injectable()
export class TemplateService {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  private resolveTemplatePath(templateName: string) {
    const candidates = [
      join(__dirname, "templates", templateName),
      resolve(process.cwd(), "dist", "src", "notifications", "templates", templateName),
      resolve(process.cwd(), "src", "notifications", "templates", templateName)
    ];

    const matched = candidates.find((candidate) => existsSync(candidate));
    if (!matched) {
      throw new Error(
        `Template not found: ${templateName}. Checked: ${candidates.join(", ")}`
      );
    }

    return matched;
  }

  private loadTemplate(templateName: string): Handlebars.TemplateDelegate {
    const cached = this.templates.get(templateName);
    if (cached) return cached;

    const templatePath = this.resolveTemplatePath(templateName);
    const source = readFileSync(templatePath, "utf-8");
    const template = Handlebars.compile(source);

    this.templates.set(templateName, template);
    return template;
  }

  renderTemplate(templateName: string, data: TemplateData): string {
    const template = this.loadTemplate(templateName);
    return template({
      ...data,
      year: new Date().getFullYear()
    });
  }
}
