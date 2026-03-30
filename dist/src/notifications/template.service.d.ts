type TemplateData = Record<string, any>;
export declare class TemplateService {
    private templates;
    private resolveTemplatePath;
    private loadTemplate;
    renderTemplate(templateName: string, data: TemplateData): string;
}
export {};
