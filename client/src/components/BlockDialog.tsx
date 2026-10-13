"use client";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, Select, SelectItem, TextInput, TextArea, InlineNotification } from "@carbon/react";
import { api } from "@/lib/api";
import type { BlockSchema, ContentBlock } from "@/lib/types";

export default function BlockDialog({ schemas, initialSchema, editing, userId, onClose, onSaved }: {
  schemas: BlockSchema[]; initialSchema: string; editing?: ContentBlock | null; userId: number;
  onClose: () => void; onSaved: (message: string) => void;
}) {
  const [schemaKey, setSchemaKey] = useState(initialSchema);
  const schema = schemas.find((item) => item.key === schemaKey);
  const formRef = useRef<HTMLFormElement>(null);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ data, title }: { data: Record<string, unknown>; title: string }) => api<ContentBlock>(editing ? `/blocks/${editing.id}` : "/blocks", {
      method: editing ? "PATCH" : "POST", body: JSON.stringify({ schema_key: schemaKey, title, data }),
    }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["blocks", userId] }); onSaved(editing ? "Career detail updated" : "Added to your career library"); onClose(); },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!schema || mutation.isPending) return;
    const form = new FormData(event.currentTarget); const data: Record<string, unknown> = {};
    for (const field of schema.fields) {
      const raw = String(form.get(field.key) || "").trim();
      data[field.key] = field.type === "list" ? raw.split("\n").map((row) => row.trim()).filter(Boolean) : raw;
    }
    const title = String(data.role || data.degree || data.name || data.headline || data.company || data.text || schema.label).slice(0, 180);
    mutation.mutate({ data, title });
  }
  return <Modal open size="sm" modalHeading={editing ? "Edit career detail" : "A new career detail"}
    modalLabel="Career library" onRequestClose={() => !mutation.isPending && onClose()} preventCloseOnClickOutside
    primaryButtonText={mutation.isPending ? "Saving…" : editing ? "Save changes" : "Save to library"}
    primaryButtonDisabled={mutation.isPending || !schema} secondaryButtonText="Cancel" onSecondarySubmit={() => !mutation.isPending && onClose()}
    onRequestSubmit={() => formRef.current?.requestSubmit()} selectorPrimaryFocus="#block-type">
    <p className="dialog-intro">Save it once. Make it part of any CV, whenever you need it.</p>
    <form ref={formRef} onSubmit={submit} className="dialog-form">
      <Select id="block-type" labelText="Detail type" value={schemaKey} disabled={Boolean(editing) || mutation.isPending}
        onChange={(event) => { setSchemaKey(event.target.value); mutation.reset(); }}>
        {schemas.map((item) => <SelectItem key={item.key} value={item.key} text={item.label}/>)}
      </Select>
      <div key={schemaKey + (editing?.id || "new")} className="dialog-fields">{schema?.fields.map((field) => {
        const value = editing?.data[field.key]; const defaultValue = Array.isArray(value) ? value.join("\n") : String(value || "");
        const common = { id: `detail-${field.key}`, name: field.key, labelText: field.label, defaultValue, required: field.required, disabled: mutation.isPending,
          placeholder: field.type === "list" ? "One item per line" : field.placeholder };
        return field.type === "textarea" || field.type === "list" ? <TextArea key={field.key} {...common} rows={4}/>
          : <TextInput key={field.key} {...common} type={field.type === "date" ? "text" : field.type}/>;
      })}</div>
      {mutation.error && <InlineNotification kind="error" title="Couldn't save this detail" subtitle={mutation.error.message} lowContrast hideCloseButton/>}
    </form>
  </Modal>;
}
