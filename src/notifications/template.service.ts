import { Injectable } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";
import Handlebars from "handlebars";

type TemplateData = Record<string, any>;

@Injectable()
export class TemplateService {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  private loadTemplate(templateName: string): Handlebars.TemplateDelegate {
    const cached = this.templates.get(templateName);
    if (cached) return cached;

    const templatePath = join(__dirname, "templates", templateName);
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
