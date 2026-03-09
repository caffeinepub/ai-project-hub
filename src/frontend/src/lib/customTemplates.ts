export interface CustomTemplate {
  id: string;
  name: string;
  category: string; // CategoryKind value e.g. "LiveWebApp"
  description: string;
  code: string;
  createdAt: number; // Date.now()
}

const STORAGE_KEY = "ai-custom-templates";

export function listTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(
  t: Omit<CustomTemplate, "id" | "createdAt">,
): CustomTemplate {
  const templates = listTemplates();
  const newTemplate: CustomTemplate = {
    ...t,
    id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  templates.unshift(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(id: string): void {
  const templates = listTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function getTemplate(id: string): CustomTemplate | undefined {
  return listTemplates().find((t) => t.id === id);
}
