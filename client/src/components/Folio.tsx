import Link from "next/link";
import { Certificate, Document, Education, Portfolio, SkillLevel, UserAvatar, Enterprise } from "@carbon/react/icons";
import type { CV } from "@/lib/types";

export function Brand({ href = "/landing" }: { href?: string }) {
  return <Link href={href} className="brand" aria-label="Folio home">folio<span>.</span></Link>;
}
export function SchemaIcon({ schema, size = 20 }: { schema: string; size?: number }) {
  const Icon = schema === "experience" ? Enterprise : schema === "education" ? Education
    : schema === "skills" ? SkillLevel : schema === "profile" ? UserAvatar
    : schema === "project" ? Portfolio : schema === "certification" ? Certificate : Document;
  return <Icon size={size} aria-hidden="true" />;
}
export function blockSubtitle(data: Record<string, unknown>, fallback: string) {
  return String(data.company || data.institution || data.issuer || data.headline || data.description || data.text || fallback);
}
export function editedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved draft" : "Edited " + date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
export function ResumeMiniature({ cv, name }: { cv: CV; name: string }) {
  const profile = cv.sections.find((section) => section.key === "profile")?.items[0]?.data;
  const sections = cv.sections.filter((section) => section.key !== "profile" && section.items.length);
  return <div className="resume-miniature" aria-hidden="true"><div className="mini-name">{String(profile?.name || name)}</div>
    <div className="mini-role">{String(profile?.headline || cv.target_role || "Your next chapter")}</div>
    <div className="mini-rule" />
    {sections.length ? sections.slice(0, 2).map((section) => <div className="mini-section" key={section.key}><h4>{section.title}</h4>
      {section.items.slice(0, 2).map((item) => <div key={item.id}><b>{item.title}</b><p>{blockSubtitle(item.data, "")}</p></div>)}</div>)
      : <div className="mini-empty"><Document size={24}/><span>A little space for your story.</span></div>}
  </div>;
}
