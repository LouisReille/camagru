const templateCache = {};

async function loadTemplate(templateName) {
    if (templateCache[templateName]) {
        return templateCache[templateName];
    }
    try {
        let templatePath = templateName;
        if (!templateName.includes("/")) {
            const folders = [ "forms", "components", "errors", "validation", "messages", "states" ];
            for (const folder of folders) {
                try {
                    const testPath = `${folder}/${templateName}`;
                    const testResponse = await fetch(`/assets/templates/${testPath}.html`);
                    if (testResponse.ok) {
                        templatePath = testPath;
                        break;
                    }
                } catch (e) {}
            }
        }
        const response = await fetch(`/assets/templates/${templatePath}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName} (tried: ${templatePath})`);
        }
        const html = await response.text();
        templateCache[templateName] = html;
        return html;
    } catch (error) {
        throw error;
    }
}

async function renderTemplate(templateName, data = {}) {
    let html = await loadTemplate(templateName);
    const ifElsePattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
    html = html.replace(ifElsePattern, (match, condition, ifContent, elseContent) => {
        const keys = condition.trim().split(".");
        let value = data;
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                return elseContent;
            }
        }
        const isTruthy = value === true || value === "true" || value && value !== false && value !== "false" && value !== 0 && value !== "";
        return isTruthy ? ifContent : elseContent;
    });
    html = html.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        const keys = condition.trim().split(".");
        let value = data;
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return "";
        }
        if (value === true || value === "true" || value && value !== false && value !== "false" && value !== 0 && value !== "") {
            return content;
        }
        return "";
    });
    html = html.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        if (key.includes("#if") || key.includes("/if") || key.includes("else")) {
            return match;
        }
        const keys = key.trim().split(".");
        let value = data;
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return "";
        }
        return value !== null && value !== undefined ? String(value) : "";
    });
    return html;
}

window.loadTemplate = loadTemplate;

window.renderTemplate = renderTemplate;

window.templateCache = templateCache;