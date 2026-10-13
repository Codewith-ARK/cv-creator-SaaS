import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { BlockSchema, CV, User } from "@/lib/types";

const s = StyleSheet.create({
  page: { backgroundColor: "#fffefa", paddingTop: 48, paddingBottom: 46, paddingHorizontal: 50, color: "#252720", fontFamily: "Helvetica", fontSize: 10 },
  name: { fontSize: 26, fontFamily: "Times-Roman", letterSpacing: -0.3 },
  headline: { fontSize: 10, color: "#285d49", marginTop: 6, textTransform: "uppercase", letterSpacing: 1.2 },
  contacts: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, marginBottom: 12 },
  contact: { color: "#65675f", fontSize: 9, marginRight: 12, marginBottom: 4 },
  section: { marginTop: 16 }, sectionTitle: { fontSize: 9, color: "#805c3f", letterSpacing: 1.2, textTransform: "uppercase", paddingBottom: 5, borderBottomWidth: 0.6, borderBottomColor: "#dcd9cf", marginBottom: 8 },
  item: { marginBottom: 9 }, itemHead: { flexDirection: "row", justifyContent: "space-between", fontSize: 10, fontFamily: "Helvetica-Bold" }, sub: { color: "#55574f", fontSize: 9, marginTop: 3 }, body: { color: "#363832", fontSize: 9.5, lineHeight: 1.5, marginTop: 4 }, bullet: { color: "#363832", fontSize: 9.5, lineHeight: 1.45, marginLeft: 9, marginTop: 2 }, skillRow: { flexDirection: "row", flexWrap: "wrap" }, skill: { fontSize: 9, color: "#40453b", backgroundColor: "#f1f0e9", paddingVertical: 4, paddingHorizontal: 6, marginRight: 5, marginBottom: 5, borderRadius: 2 },
});

function text(data: Record<string, unknown>, key: string) { const val = data[key]; return typeof val === "string" ? val : ""; }
function list(data: Record<string, unknown>, key: string) { const val = data[key]; return Array.isArray(val) ? val.map(String) : typeof val === "string" ? val.split(/\n|,/).map((x) => x.trim()).filter(Boolean) : []; }
function BlockContent({ schema, data }: { schema: string; data: Record<string, unknown> }) {
  if (schema === "profile") return null;
  if (schema === "experience") return <><View style={s.itemHead}><Text>{text(data, "role") || "Experience"}</Text><Text>{[text(data, "start_date"), text(data, "end_date")].filter(Boolean).join(" – ")}</Text></View><Text style={s.sub}>{[text(data, "company"), text(data, "location")].filter(Boolean).join(" · ")}</Text>{list(data, "achievements").map((x, i) => <Text key={i} style={s.bullet}>•  {x}</Text>)}</>;
  if (schema === "education") return <><View style={s.itemHead}><Text>{text(data, "degree") || "Education"}</Text><Text>{[text(data, "start_date"), text(data, "end_date")].filter(Boolean).join(" – ")}</Text></View><Text style={s.sub}>{[text(data, "institution"), text(data, "location")].filter(Boolean).join(" · ")}</Text>{text(data, "details") && <Text style={s.body}>{text(data, "details")}</Text>}</>;
  if (schema === "skills") return <View style={s.skillRow}>{list(data, "items").map((x, i) => <Text key={i} style={s.skill}>{x}</Text>)}</View>;
  if (schema === "summary") return <Text style={s.body}>{text(data, "text")}</Text>;
  if (schema === "project") return <><View style={s.itemHead}><Text>{text(data, "name") || "Project"}</Text><Text>{text(data, "dates")}</Text></View><Text style={s.sub}>{text(data, "role")}</Text><Text style={s.body}>{text(data, "description")}</Text>{text(data, "url") && <Link src={text(data, "url")} style={s.sub}>{text(data, "url")}</Link>}</>;
  if (schema === "certification") return <><View style={s.itemHead}><Text>{text(data, "name") || "Certification"}</Text><Text>{text(data, "date")}</Text></View><Text style={s.sub}>{text(data, "issuer")}</Text></>;
  return <Text style={s.body}>{Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" · ")}</Text>;
}

export default function ResumeDocument({ cv, user, schemas }: { cv: CV; user: User; schemas: BlockSchema[] }) {
  const profile = cv.sections.find((section) => section.key === "profile")?.items[0]?.data || {};
  const name = text(profile, "name") || user.name;
  const headline = text(profile, "headline") || cv.target_role;
  const contacts = [text(profile, "email") || user.email, text(profile, "phone"), text(profile, "location"), text(profile, "website")].filter(Boolean);
  return <Document title={cv.name} author={name} subject={headline}><Page size={cv.page_size === "Letter" ? "LETTER" : "A4"} style={s.page}>
    <Text style={s.name}>{name}</Text>{headline && <Text style={s.headline}>{headline}</Text>}
    <View style={s.contacts}>{contacts.map((item, i) => <Text key={i} style={s.contact}>{item}</Text>)}</View>
    {cv.sections.filter((section) => section.items.length && section.key !== "profile").map((section) => <View style={s.section} key={section.key} wrap>
      <Text style={s.sectionTitle}>{section.title || schemas.find((schema) => schema.key === section.key)?.label || section.key}</Text>
      {section.items.map((item) => <View key={item.id} style={s.item} wrap={false}><BlockContent schema={section.key} data={item.data} /></View>)}
    </View>)}
  </Page></Document>;
}
