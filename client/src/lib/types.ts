export type User = { id: number; email: string; name: string; role: "client" | "admin" };
export type Field = { key: string; label: string; type: "text" | "textarea" | "date" | "url" | "email" | "list"; required: boolean; placeholder?: string };
export type BlockSchema = { key: string; label: string; description: string; icon: string; fields: Field[]; active: boolean; version: number };
export type ContentBlock = { id: number; schema_key: string; title: string; data: Record<string, unknown>; version: number; updated_at: string };
export type CVItem = { id: string; source_block_id?: number; snapshot_version?: number; data: Record<string, unknown>; title: string; stale?: boolean; source_version?: number };
export type CVSection = { key: string; title: string; items: CVItem[] };
export type CV = { id: number; name: string; target_role: string; template_key: string; page_size: "A4" | "Letter"; sections: CVSection[]; updated_at: string };
