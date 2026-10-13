"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form, TextInput, PasswordInput, Search, Select, SelectItem, Modal, InlineNotification, ToastNotification, OverflowMenu, OverflowMenuItem, SkeletonText, SkeletonPlaceholder, Tag } from "@carbon/react";
import { Add, ArrowRight, ArrowUpRight, Document, Catalog } from "@carbon/react/icons";
import { api, ApiError, clearSession, getStoredUser, login, register, setSession } from "@/lib/api";
import { useWorkspace } from "@/lib/queries";
import type { CV, ContentBlock, User } from "@/lib/types";
import AppShell from "@/components/AppShell";
import BlockDialog from "@/components/BlockDialog";
import { Brand, ResumeMiniature, SchemaIcon, blockSubtitle, editedDate } from "@/components/Folio";

function AuthView({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = useMutation({
    mutationFn: (form: FormData) => signup
      ? register(String(form.get("name")).trim(), String(form.get("email")).trim(), String(form.get("password")))
      : login(String(form.get("email")).trim(), String(form.get("password"))),
    onSuccess: (result) => {
      setSession(result.access_token, result.user);
      if (result.user.role === "admin") { window.location.assign(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"); return; }
      onAuthenticated(result.user);
    },
  });
  useEffect(() => { setSignup(new URLSearchParams(window.location.search).has("signup")); }, []);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth.isPending) auth.mutate(new FormData(event.currentTarget)); }
  return <main className="auth-page">
    <div className="auth-story"><Brand/><div className="auth-story-copy"><span className="small-label">For your next chapter</span><h1>Your experience.<br/>A little more possibility.</h1><p>A home for everything you've done, and a starting point for what comes next.</p></div>
      <img src="/images/career-desk.png" alt="A professional writing career notes at a sunlit desk" className="auth-photo"/><Link href="/landing" className="auth-about">Take a look around <ArrowUpRight size={20}/></Link>
    </div>
    <div className="auth-form-area"><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-wrap"><p className="auth-overline">YOUR PERSONAL WORKSPACE</p><h2>{signup ? "A fresh start." : "Welcome back."}</h2><p>{signup ? "Give your experience a place to grow." : "Pick up your story where you left off."}</p>
      <Form onSubmit={submit} className="auth-form" key={signup ? "signup" : "login"}>
        {signup && <TextInput id="auth-name" name="name" labelText="Your name" autoComplete="name" placeholder="What should we call you?" required minLength={2} maxLength={160}/>}
        <TextInput id="auth-email" name="email" labelText="Email address" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required/>
        <PasswordInput id="auth-password" name="password" labelText="Password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : "Your password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={signup ? 8 : undefined} maxLength={signup ? 128 : undefined}/>
        {auth.error && <InlineNotification kind="error" title={signup ? "Couldn't create your account" : "Couldn't sign in"} subtitle={auth.error.message} lowContrast hideCloseButton/>}
        <Button type="submit" renderIcon={ArrowRight} disabled={auth.isPending} className="auth-submit">{auth.isPending ? "One moment…" : signup ? "Create your account" : "Sign in"}</Button>
      </Form>
      <p className="auth-switch">{signup ? "Already part of Folio?" : "New around here?"} <button onClick={() => { setSignup(!signup); auth.reset(); }}>{signup ? "Sign in" : "Create an account"}</button></p>
      {process.env.NODE_ENV === "development" && !signup && <div className="demo-access"><span>Exploring locally?</span><button onClick={() => { setEmail("demo@folio.local"); setPassword("folio-demo"); auth.reset(); }}>Fill demo details</button><button onClick={() => { setEmail("admin@folio.local"); setPassword("folio-admin"); auth.reset(); }}>Fill admin details</button></div>}
    </div><span className="auth-footer">A little clarity for your next move.</span></div>
  </main>;
}

export default function HomePage() {
  const router = useRouter();
  const client = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<"cvs" | "library">("cvs");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<{ schema: string; block?: ContentBlock } | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "cvs" | "blocks"; id: number; name: string } | null>(null);
  const [notice, setNotice] = useState("");
  const createForm = useRef<HTMLFormElement>(null);
  const data = useWorkspace(user?.role === "client" ? user.id : undefined);
  const cvs = data.cvs.data || [];
  const blocks = data.blocks.data || [];
  const schemas = data.schemas.data || [];
  const error = data.cvs.error || data.blocks.error || data.schemas.error;
  const loading = data.cvs.isPending || data.blocks.isPending || data.schemas.isPending;
  useEffect(() => {
    const stored = getStoredUser();
    if (stored?.role === "admin") { window.location.assign(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"); return; }
    setUser(stored); setReady(true);
    if (window.location.hash === "#library") setActive("library");
  }, []);
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) { clearSession(); client.clear(); setUser(null); }
  }, [error, client]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); }, [notice]);
  const create = useMutation({
    mutationFn: (values: { name: string; role: string }) => api<CV>("/cvs", { method: "POST", body: JSON.stringify({ name: values.name, target_role: values.role, template_key: "paper", page_size: "A4", sections: [] }) }),
    onSuccess: (cv) => { void client.invalidateQueries({ queryKey: ["cvs", user?.id] }); router.push("/editor/" + cv.id); },
  });
  const remove = useMutation({
    mutationFn: (target: { kind: string; id: number }) => api("/" + target.kind + "/" + target.id, { method: "DELETE" }),
    onSuccess: (_, target) => { void client.invalidateQueries({ queryKey: [target.kind, user?.id] }); setDeleting(null); setNotice(target.kind === "cvs" ? "CV removed" : "Detail removed. Existing CV snapshots are preserved."); },
  });
  const duplicate = useMutation({
    mutationFn: (cv: CV) => api<CV>("/cvs", { method: "POST", body: JSON.stringify({ name: cv.name + " (copy)", target_role: cv.target_role, template_key: cv.template_key, page_size: cv.page_size, sections: cv.sections }) }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["cvs", user?.id] }); setNotice("A fresh copy is ready"); },
  });
  function navigate(page: "cvs" | "library") { setActive(page); setQuery(""); setCategory("all"); window.history.replaceState(null, "", page === "library" ? "/#library" : "/"); }
  function signOut() { void client.cancelQueries(); clearSession(); client.clear(); setUser(null); }
  function openCreate() { create.reset(); setCreateOpen(true); }
  function submitCV(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (create.isPending) return;
    const form = new FormData(event.currentTarget); create.mutate({ name: String(form.get("name")).trim(), role: String(form.get("role")).trim() });
  }
  if (!ready) return <main className="page-loader"><Brand/><SkeletonText paragraph lineCount={3}/></main>;
  if (!user) return <AuthView onAuthenticated={(value) => { client.clear(); setUser(value); }}/>;
  const visibleCVs = cvs.filter((cv) => (cv.name + " " + cv.target_role).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const visibleBlocks = blocks.filter((block) => (category === "all" || block.schema_key === category) && (block.title + " " + blockSubtitle(block.data, "")).toLowerCase().includes(query.toLowerCase()));
  return <AppShell user={user} active={active} onNavigate={navigate} onSignOut={signOut}>
    <section className="workspace-welcome"><div><p className="welcome-note">Good to see you, {user.name.split(" ")[0]}.</p><h1>{active === "cvs" ? "Your next move starts here." : "The details that make you, you."}</h1><p>{active === "cvs" ? "One story. A version for every opportunity." : "Keep your experience close. Reuse it whenever the right opportunity comes along."}</p></div>
      <div className="workspace-totals"><div><strong>{cvs.length.toString().padStart(2, "0")}</strong><span>CV versions</span></div><div><strong>{blocks.length.toString().padStart(2, "0")}</strong><span>Saved details</span></div></div></section>
    {error && <div className="workspace-error"><InlineNotification kind="error" title="We couldn't load your workspace" subtitle={error.message} lowContrast hideCloseButton/><Button kind="tertiary" size="sm" onClick={() => { void data.cvs.refetch(); void data.blocks.refetch(); void data.schemas.refetch(); }}>Try again</Button></div>}
    {loading && !error ? <div className="workspace-skeleton"><SkeletonPlaceholder/><SkeletonPlaceholder/><SkeletonPlaceholder/></div> : <>
      <section className="collection-section"><div className="collection-heading"><div><h2>{active === "cvs" ? "My CVs" : "Career library"} <span className="collection-count">{active === "cvs" ? cvs.length : blocks.length}</span></h2><p>{active === "cvs" ? "Thoughtful versions of your experience, ready for what's next." : "Your source material. Every CV keeps its own selected snapshot."}</p></div>
        <Button renderIcon={Add} onClick={() => active === "cvs" ? openCreate() : schemas[0] && setDetail({ schema: schemas[0].key })} disabled={active === "library" && !schemas.length}>{active === "cvs" ? "Create a CV" : "Add a career detail"}</Button></div>
        <div className="collection-controls"><Search id="workspace-search" size="md" labelText={active === "cvs" ? "Search CVs" : "Search career details"} placeholder={active === "cvs" ? "Find a CV…" : "Find a career detail…"} value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")}/>
          {active === "cvs" && <Select id="cv-sort" labelText="Sort CVs" hideLabel size="md" value={sort} onChange={(event) => setSort(event.target.value)}><SelectItem value="recent" text="Recently edited"/><SelectItem value="name" text="Name, A to Z"/></Select>}</div>
        {active === "cvs" ? <>{visibleCVs.length ? <div className="cv-grid">{visibleCVs.map((cv) => <article className="cv-card" key={cv.id}>
          <div className="cv-card-menu"><Tag type="gray" size="sm">{cv.page_size}</Tag><OverflowMenu size="sm" flipped iconDescription={"Actions for " + cv.name}>
            <OverflowMenuItem itemText="Duplicate CV" disabled={duplicate.isPending} onClick={() => duplicate.mutate(cv)}/><OverflowMenuItem itemText="Delete CV" isDelete onClick={() => { remove.reset(); setDeleting({ kind: "cvs", id: cv.id, name: cv.name }); }}/></OverflowMenu></div>
          <Link className="cv-card-main" href={"/editor/" + cv.id}><div className="cv-preview"><ResumeMiniature cv={cv} name={user.name}/></div><div className="cv-card-copy"><h3>{cv.name}</h3><p>{cv.target_role || "Ready for a new direction"}</p><div className="cv-card-footer"><span>{editedDate(cv.updated_at)}</span><span>Continue editing <ArrowUpRight size={16}/></span></div></div></Link>
        </article>)}<button className="new-cv-card" onClick={openCreate}><span className="new-cv-icon"><Add size={28}/></span><strong>A new possibility?</strong><p>Start another version of your story.</p><span>Create a CV <ArrowRight size={18}/></span></button></div>
          : <div className="empty-state"><Document size={44}/><h3>{query ? "No CVs found." : "Your first CV is a fresh page."}</h3><p>{query ? "Try a different name or target role." : "Start a version, pick your career details, and make it yours."}</p><Button kind="tertiary" renderIcon={query ? undefined : Add} onClick={() => query ? setQuery("") : openCreate()}>{query ? "Clear search" : "Create your first CV"}</Button></div>}
          {duplicate.error && <InlineNotification kind="error" title="Couldn't duplicate this CV" subtitle={duplicate.error.message} lowContrast hideCloseButton/>}
          <div className="library-invitation"><span className="invitation-icon"><Catalog size={28}/></span><div><h3>Good stories start with the details.</h3><p>Add your roles, projects and accomplishments to your career library. They'll be ready for every version.</p></div><Button kind="ghost" renderIcon={ArrowRight} onClick={() => navigate("library")}>Visit your library</Button></div>
        </> : <><div className="category-filters" aria-label="Filter career details"><button className={category === "all" ? "selected" : ""} aria-pressed={category === "all"} onClick={() => setCategory("all")}>All details <span>{blocks.length}</span></button>
          {schemas.map((schema) => <button className={category === schema.key ? "selected" : ""} aria-pressed={category === schema.key} key={schema.key} onClick={() => setCategory(schema.key)}>{schema.label}<span>{blocks.filter((block) => block.schema_key === schema.key).length}</span></button>)}</div>
          {visibleBlocks.length ? <div className="career-grid">{visibleBlocks.map((block) => { const schema = schemas.find((row) => row.key === block.schema_key); return <article className="career-card" key={block.id}><div className="career-card-top"><span className="detail-icon"><SchemaIcon schema={block.schema_key}/></span><span>{schema?.label || block.schema_key}</span><OverflowMenu size="sm" flipped iconDescription={"Actions for " + block.title}><OverflowMenuItem itemText="Edit detail" disabled={!schema} onClick={() => setDetail({ schema: block.schema_key, block })}/><OverflowMenuItem itemText="Delete detail" isDelete onClick={() => { remove.reset(); setDeleting({ kind: "blocks", id: block.id, name: block.title }); }}/></OverflowMenu></div><h3>{block.title}</h3><p>{blockSubtitle(block.data, schema?.description || "Saved career detail")}</p><div className="career-card-footer"><span>Version {block.version}</span><Button kind="ghost" size="sm" onClick={() => setDetail({ schema: block.schema_key, block })} disabled={!schema}>Edit detail</Button></div></article>; })}</div>
            : <div className="empty-state"><Catalog size={44}/><h3>{query || category !== "all" ? "No matching details." : "Start with a little experience."}</h3><p>{query || category !== "all" ? "Try another search or detail type." : "A past role, a project you're proud of, a skill you've earned. Every detail counts."}</p>{schemas.length > 0 && <Button kind="tertiary" renderIcon={Add} onClick={() => setDetail({ schema: schemas[0].key })}>Add your first detail</Button>}</div>}
        </>}</section>
      <footer className="workspace-footer"><span>A little clarity. A little possibility.</span><Brand/></footer>
    </>}
    <Modal open={createOpen} size="sm" modalHeading="A CV for your next chapter" primaryButtonText={create.isPending ? "Creating…" : "Create CV"} secondaryButtonText="Cancel" primaryButtonDisabled={create.isPending} onRequestClose={() => !create.isPending && setCreateOpen(false)} onSecondarySubmit={() => setCreateOpen(false)} onRequestSubmit={() => createForm.current?.requestSubmit()} selectorPrimaryFocus="#cv-name">
      <p className="dialog-intro">Give this version a name. You can choose its details in the editor.</p><form className="dialog-form" ref={createForm} onSubmit={submitCV}><TextInput id="cv-name" name="name" labelText="CV name" placeholder="e.g. Product design · Monzo" required minLength={1} maxLength={180}/><TextInput id="cv-role" name="role" labelText="Target role (optional)" placeholder="e.g. Senior Product Designer" maxLength={180}/>{create.error && <InlineNotification kind="error" title="Couldn't create your CV" subtitle={create.error.message} lowContrast hideCloseButton/>}</form>
    </Modal>
    {detail && <BlockDialog schemas={schemas} initialSchema={detail.schema} editing={detail.block} userId={user.id} onClose={() => setDetail(null)} onSaved={setNotice}/>}
    <Modal open={Boolean(deleting)} size="xs" danger modalHeading={"Delete “" + (deleting?.name || "") + "”?"} primaryButtonText={remove.isPending ? "Deleting…" : "Delete"} primaryButtonDisabled={remove.isPending} secondaryButtonText="Keep it" onRequestClose={() => !remove.isPending && setDeleting(null)} onSecondarySubmit={() => setDeleting(null)} onRequestSubmit={() => deleting && remove.mutate(deleting)}>
      <p>{deleting?.kind === "blocks" ? "This removes the detail from your library. Existing CV snapshots will stay as they are." : "This CV will be permanently removed. Your career library will stay as it is."}</p>{remove.error && <InlineNotification kind="error" title="Couldn't delete" subtitle={remove.error.message} lowContrast hideCloseButton/>}
    </Modal>
    {notice && <div className="notice-stack"><ToastNotification kind="success" title={notice} subtitle="" lowContrast onCloseButtonClick={() => { setNotice(""); return false; }}/></div>}
  </AppShell>;
}

