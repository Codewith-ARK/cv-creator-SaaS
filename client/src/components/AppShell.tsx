"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@carbon/react";
import { Document, Catalog, Logout, ArrowUpRight } from "@carbon/react/icons";
import { Brand } from "./Folio";
import type { User } from "@/lib/types";

export default function AppShell({ user, active, onNavigate, onSignOut, children }: {
  user: User; active: "cvs" | "library"; onNavigate: (page: "cvs" | "library") => void; onSignOut: () => void; children: ReactNode;
}) {
  return <div className="workspace-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="workspace-sidebar"><Brand/><p className="sidebar-caption">A home for your experience.</p>
      <nav aria-label="Workspace"><button className={active === "cvs" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("cvs")} aria-current={active === "cvs" ? "page" : undefined}><Document size={20}/>My CVs</button>
        <button className={active === "library" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("library")} aria-current={active === "library" ? "page" : undefined}><Catalog size={20}/>Career library</button></nav>
      <div className="sidebar-note"><span>Your story is still unfolding.</span><p>Keep the details. You never know which one will open the next door.</p><Link href="/landing">Meet Folio <ArrowUpRight size={16}/></Link></div>
      <div className="sidebar-account"><div className="account-avatar">{user.name.slice(0, 1)}</div><div className="account-copy"><strong>{user.name}</strong><span>{user.email}</span></div>
        <Button kind="ghost" size="sm" hasIconOnly renderIcon={Logout} iconDescription="Sign out" onClick={onSignOut}/></div>
    </aside>
    <div className="workspace-body"><header className="workspace-header"><span>Workspace <span className="breadcrumb-slash">/</span><b>{active === "cvs" ? "My CVs" : "Career library"}</b></span><Link href="/landing" className="quiet-link">About Folio <ArrowUpRight size={16}/></Link></header>
      <main id="main-content" className="workspace-content">{children}</main></div>
  </div>;
}
