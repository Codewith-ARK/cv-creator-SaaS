"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Search, Select, SelectItem, Tag, InlineNotification, ToastNotification, Modal, TextInput, OverflowMenu, OverflowMenuItem, SkeletonPlaceholder } from "@carbon/react";
import { Add, ArrowLeft, ArrowUp, ArrowDown, Checkmark, Close, DragVertical, Edit, Document, View, Catalog } from "@carbon/react/icons";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api, getStoredUser, getBlocks, getSchemas, ApiError, clearSession } from "@/lib/api";
import type { BlockSchema, ContentBlock, CV, CVItem, CVSection, User } from "@/lib/types";
import BlockDialog from "@/components/BlockDialog";
import { Brand, SchemaIcon, blockSubtitle } from "@/components/Folio";

const PdfPreview = dynamic(() => import("@/components/PdfPreview"), { ssr: false, loading: () => <div className="pdf-loading"><SkeletonPlaceholder/><p>Preparing your document…</p></div> });

function SourceBlock({ block, schema, added, onAdd, onEdit }: { block: ContentBlock; schema?: BlockSchema; added: boolean; onAdd: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: "source:" + block.id, data: { kind: "source", block }, disabled: added });
  return <article ref={setNodeRef} className={"source-block" + (added ? " is-added" : "")} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? .45 : 1 }}>
    <div className="source-block-heading"><span className="detail-icon"><SchemaIcon schema={block.schema_key} size={18}/></span><span>{schema?.label || block.schema_key}</span><button className="drag-handle" aria-label={"Drag " + block.title + " into the outline"} disabled={added} {...attributes} {...listeners}><DragVertical size={18}/></button></div>
    <strong>{block.title}</strong><p>{blockSubtitle(block.data, schema?.description || "Career detail")}</p>
    <div className="source-block-actions"><Button kind="ghost" size="sm" renderIcon={added ? Checkmark : Add} onClick={onAdd} disabled={added}>{added ? "In this CV" : "Add to CV"}</Button><Button kind="ghost" size="sm" hasIconOnly iconDescription={"Edit " + block.title} renderIcon={Edit} onClick={onEdit} disabled={!schema}/></div>
  </article>;
}
function Section({ section, children }: { section: CVSection; children: ReactNode }) {
  const sortable = useSortable({ id: "section:" + section.key, data: { kind: "section", sectionKey: section.key } });
  const drop = useDroppable({ id: "drop:" + section.key, data: { kind: "drop", sectionKey: section.key } });
  return <section ref={sortable.setNodeRef} className={"outline-section" + (drop.isOver ? " is-over" : "")} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? .5 : 1 }}>
    <div className="outline-section-head"><button className="drag-handle" aria-label={"Reorder " + section.title} {...sortable.attributes} {...sortable.listeners}><DragVertical size={20}/></button><h3>{section.title}</h3><span>{section.items.length}</span></div>
    <div ref={drop.setNodeRef} className="outline-items">{children}{!section.items.length && <p className="drop-help">Add or drop a detail here.</p>}</div>
  </section>;
}
function OutlineDrop({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "cv-outline", data: { kind: "outline" } });
  return <div ref={setNodeRef} className={"outline-drop-zone" + (isOver ? " is-over" : "")}>{children}</div>;
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [cv, setCv] = useState<CV | null>(null);
  const [revision, setRevision] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<{ schema: string; block?: ContentBlock } | null>(null);
  const [notice, setNotice] = useState("");
  const [rename, setRename] = useState(false);
  const [view, setView] = useState("edit");
  const renameRef = useRef<HTMLFormElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const cvQuery = useQuery({ queryKey: ["cv", user?.id, id], queryFn: ({ signal }) => api<CV>("/cvs/" + id, { signal }), enabled: Boolean(user) && id !== "new" });
  const blockQuery = useQuery({ queryKey: ["blocks", user?.id], queryFn: ({ signal }) => getBlocks(signal), enabled: Boolean(user) });
  const schemaQuery = useQuery({ queryKey: ["schemas", user?.id], queryFn: ({ signal }) => getSchemas(signal), enabled: Boolean(user) });
  const blocks = blockQuery.data || [];
  const schemas = schemaQuery.data || [];
  const schemaByKey = Object.fromEntries(schemas.map((schema) => [schema.key, schema]));
  const loadError = cvQuery.error || blockQuery.error || schemaQuery.error;
  const save = useMutation({
    scope: { id: "save-cv-" + id },
    mutationFn: ({ draft }: { draft: CV; version: number }) => api<CV>("/cvs/" + draft.id, { method: "PUT", body: JSON.stringify(draft) }),
    onSuccess: (saved, variables) => {
      setSavedRevision(variables.version);
      client.setQueryData(["cv", user?.id, id], saved);
      void client.invalidateQueries({ queryKey: ["cvs", user?.id] });
    },
  });
  const saveDraft = save.mutate;
  useEffect(() => { const stored = getStoredUser(); if (!stored) { router.replace("/"); return; } setUser(stored); }, [router]);
  useEffect(() => { setCv(null); setRevision(0); setSavedRevision(0); }, [id]);
  useEffect(() => { if (cvQuery.data && !cv) setCv(structuredClone(cvQuery.data)); }, [cvQuery.data, cv]);
  useEffect(() => {
    if (!cv || !revision) return;
    const timer = setTimeout(() => saveDraft({ draft: cv, version: revision }), 650);
    return () => clearTimeout(timer);
  }, [cv, revision, saveDraft]);
  useEffect(() => {
    if (revision <= savedRevision) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [revision, savedRevision]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (loadError instanceof ApiError && loadError.status === 401) { clearSession(); client.clear(); router.replace("/"); } }, [loadError, router, client]);

  function update(next: CV) { setCv(next); setRevision((value) => value + 1); }
  function addBlock(block: ContentBlock, sectionKey?: string) {
    if (!cv || cv.sections.some((section) => section.items.some((item) => item.source_block_id === block.id))) return;
    const key = sectionKey || block.schema_key;
    const sections = cv.sections.map((section) => ({ ...section, items: [...section.items] }));
    let section = sections.find((row) => row.key === key);
    if (!section) { section = { key, title: schemaByKey[key]?.label || key, items: [] }; sections.push(section); }
    section.items.push({ id: crypto.randomUUID(), source_block_id: block.id, snapshot_version: block.version, data: structuredClone(block.data), title: block.title });
    update({ ...cv, sections }); setNotice("Added “" + block.title + "”");
  }
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!cv || !over) return;
    const source = active.data.current; const target = over.data.current;
    if (source?.kind === "source") { addBlock(source.block, target?.sectionKey); return; }
    if (source?.kind === "section" && target?.sectionKey) {
      const from = cv.sections.findIndex((section) => section.key === source.sectionKey);
      const to = cv.sections.findIndex((section) => section.key === target.sectionKey);
      if (from >= 0 && to >= 0 && from !== to) update({ ...cv, sections: arrayMove(cv.sections, from, to) });
    }
  }
  function changeItem(sectionKey: string, itemId: string, direction?: -1 | 1) {
    if (!cv) return;
    update({ ...cv, sections: cv.sections.map((section) => {
      if (section.key !== sectionKey) return section;
      const index = section.items.findIndex((item) => item.id === itemId);
      return { ...section, items: direction ? arrayMove(section.items, index, index + direction) : section.items.filter((item) => item.id !== itemId) };
    }) });
  }
  function isStale(item: CVItem) { const source = blocks.find((block) => block.id === item.source_block_id); return source ? source.version !== item.snapshot_version : Boolean(item.stale); }
  function applyUpdate(sectionKey: string, item: CVItem) {
    const source = blocks.find((block) => block.id === item.source_block_id); if (!source || !cv) return;
    update({ ...cv, sections: cv.sections.map((section) => section.key === sectionKey ? { ...section, items: section.items.map((row) => row.id === item.id ? { ...row, title: source.title, data: structuredClone(source.data), snapshot_version: source.version, stale: false } : row) } : section) });
  }
  async function finish() {
    if (!cv) return; setFinishing(true);
    try { if (revision > savedRevision || save.isPending) await save.mutateAsync({ draft: cv, version: revision }); router.push("/"); }
    catch { setFinishing(false); }
  }
  if (id === "new") return <main className="page-loader"><Brand/><h1>Start with a named version.</h1><p>Create a CV from your workspace, then choose the details to include.</p><Button href="/" renderIcon={ArrowLeft}>Back to workspace</Button></main>;
  if (loadError) return <main className="page-loader"><Brand/><InlineNotification kind="error" title="Couldn't open this CV" subtitle={loadError.message} hideCloseButton lowContrast/><Button kind="tertiary" onClick={() => { void cvQuery.refetch(); void blockQuery.refetch(); void schemaQuery.refetch(); }}>Try again</Button><Link href="/">Back to workspace</Link></main>;
  if (!cv || !user || blockQuery.isPending || schemaQuery.isPending) return <main className="editor-loading"><SkeletonPlaceholder/><SkeletonPlaceholder/></main>;
  const filtered = blocks.filter((block) => (block.title + " " + blockSubtitle(block.data, "") + " " + (schemaByKey[block.schema_key]?.label || "")).toLowerCase().includes(query.toLowerCase()));
  const total = cv.sections.reduce((count, section) => count + section.items.length, 0);
  return <div className="editor-page"><a className="skip-link" href="#editor-outline">Skip to CV outline</a>
    <header className="editor-header"><div className="editor-header-left"><Brand href="/"/><span className="editor-header-separator"/><Button kind="ghost" size="sm" hasIconOnly iconDescription="Back to workspace" renderIcon={ArrowLeft} onClick={finish}/><div className="editor-heading"><h1>{cv.name}</h1><span>{cv.target_role || "A new version of your story"}</span></div><Button kind="ghost" size="sm" hasIconOnly iconDescription="Rename this CV" renderIcon={Edit} onClick={() => setRename(true)}/></div>
      <div className="editor-header-actions"><span className={"save-indicator" + (save.error ? " save-error" : "")} aria-live="polite">{save.error ? "Save failed" : save.isPending ? "Saving…" : revision > savedRevision ? "Unsaved changes" : <><Checkmark size={16}/>All changes saved</>}</span><Select id="page-size" labelText="Page size" hideLabel size="sm" value={cv.page_size} onChange={(event) => update({ ...cv, page_size: event.target.value as CV["page_size"] })}><SelectItem value="A4" text="A4"/><SelectItem value="Letter" text="US Letter"/></Select><Button kind="tertiary" size="sm" onClick={finish} disabled={finishing}>{finishing ? "Saving…" : "Done"}</Button></div>
    </header>
    {save.error && <div className="editor-save-error"><InlineNotification kind="error" title="Your latest changes haven't saved" subtitle={save.error.message} lowContrast hideCloseButton/><Button size="sm" kind="tertiary" onClick={() => save.mutate({ draft: cv, version: revision })}>Retry save</Button></div>}
    <div className="mobile-editor-tabs"><button className={view === "edit" ? "selected" : ""} onClick={() => setView("edit")} aria-pressed={view === "edit"}><Edit size={16}/>Build your CV</button><button className={view === "preview" ? "selected" : ""} onClick={() => setView("preview")} aria-pressed={view === "preview"}><View size={16}/>Preview & export</button></div>
    <DndContext sensors={sensors} onDragEnd={onDragEnd}><main className="editor-layout" data-view={view}>
      <aside className="source-panel"><div className="panel-heading"><span className="panel-icon"><Catalog size={22}/></span><div><h2>Career library</h2><p>Your experience, ready to use.</p></div></div><Search id="source-search" labelText="Search career library" size="sm" placeholder="Find a detail…" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")}/>
        <div className="source-list">{filtered.map((block) => <SourceBlock key={block.id} block={block} schema={schemaByKey[block.schema_key]} added={cv.sections.some((section) => section.items.some((item) => item.source_block_id === block.id))} onAdd={() => addBlock(block)} onEdit={() => setDetail({ schema: block.schema_key, block })}/>)}
          {!filtered.length && <div className="panel-empty"><Catalog size={28}/><p>{query ? "No matching details." : "Every story starts with a detail."}</p></div>}</div>
        <Button kind="tertiary" size="sm" renderIcon={Add} disabled={!schemas.length} onClick={() => setDetail({ schema: schemas[0].key })}>Add a career detail</Button><p className="panel-footnote">Add a detail with the button, or drag it into your outline.</p>
      </aside>
      <section className="outline-panel" id="editor-outline"><div className="panel-heading"><span className="panel-icon"><Document size={22}/></span><div><h2>Your CV outline</h2><p>{total} {total === 1 ? "detail" : "details"} selected</p></div></div><p className="outline-intro">A little editing makes a big difference. Keep what matters for this role.</p>
        <OutlineDrop>{cv.sections.length ? <SortableContext items={cv.sections.map((section) => "section:" + section.key)} strategy={verticalListSortingStrategy}>{cv.sections.map((section) => <Section key={section.key} section={section}>{section.items.map((item, index) => <div className="outline-item" key={item.id}><strong>{item.title}</strong><div className="outline-item-actions"><Button kind="ghost" size="sm" hasIconOnly renderIcon={ArrowUp} iconDescription={"Move " + item.title + " up"} disabled={index === 0} onClick={() => changeItem(section.key, item.id, -1)}/><Button kind="ghost" size="sm" hasIconOnly renderIcon={ArrowDown} iconDescription={"Move " + item.title + " down"} disabled={index === section.items.length - 1} onClick={() => changeItem(section.key, item.id, 1)}/><Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription={"Remove " + item.title} onClick={() => changeItem(section.key, item.id)}/></div>{isStale(item) && <div className="source-update"><span>Your library has a newer version.</span><Button kind="ghost" size="sm" onClick={() => applyUpdate(section.key, item)}>Apply update</Button></div>}</div>)}</Section>)}</SortableContext>
          : <div className="outline-empty"><Add size={32}/><h3>What belongs in this version?</h3><p>Add a few details from your library. Your document will take shape alongside you.</p></div>}</OutlineDrop>
        <p className="panel-footnote">Drag the section handles to change their order. Keyboard: Space to pick up, arrows to move, Space to drop.</p>
      </section>
      <section className="document-panel"><div className="document-panel-heading"><div><span className="small-label">LIVE DOCUMENT</span><h2>Looking like you.</h2></div><Tag type="cool-gray">Folio Paper</Tag></div><PdfPreview cv={cv} user={user} schemas={schemas}/><p className="document-note">Your preview and downloaded PDF share the same document.</p></section>
    </main></DndContext>
    {detail && <BlockDialog schemas={schemas} initialSchema={detail.schema} editing={detail.block} userId={user.id} onClose={() => setDetail(null)} onSaved={setNotice}/>}
    {rename && <Modal open size="sm" modalHeading="Give this version a name" primaryButtonText="Save name" secondaryButtonText="Cancel" onRequestClose={() => setRename(false)} onSecondarySubmit={() => setRename(false)} onRequestSubmit={() => renameRef.current?.requestSubmit()} selectorPrimaryFocus="#rename-cv"><form ref={renameRef} className="dialog-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); update({ ...cv, name: String(form.get("name")).trim(), target_role: String(form.get("role")).trim() }); setRename(false); }}><TextInput id="rename-cv" name="name" labelText="CV name" defaultValue={cv.name} required maxLength={180}/><TextInput id="rename-role" name="role" labelText="Target role" defaultValue={cv.target_role} maxLength={180}/></form></Modal>}
    {notice && <div className="notice-stack"><ToastNotification kind="success" title={notice} subtitle="" lowContrast onCloseButtonClick={() => { setNotice(""); return false; }}/></div>}
  </div>;
}

