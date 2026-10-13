"use client";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Download } from "@carbon/react/icons";
import type { BlockSchema, CV, User } from "@/lib/types";
import ResumeDocument from "./ResumeDocument";

export default function PdfPreview({ cv, user, schemas }: { cv: CV; user: User; schemas: BlockSchema[] }) {
  const fileName = (cv.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "folio-cv") + ".pdf";
  return <><div className="pdf-frame"><PDFViewer width="100%" height="100%" showToolbar={false} className="pdf-viewer"><ResumeDocument cv={cv} user={user} schemas={schemas}/></PDFViewer></div>
    <div className="pdf-export"><span>{cv.page_size} document</span><PDFDownloadLink document={<ResumeDocument cv={cv} user={user} schemas={schemas}/>} fileName={fileName} className="cds--btn cds--btn--primary cds--btn--sm">{({ loading }) => <>{loading ? "Preparing PDF…" : "Download PDF"}<Download size={16} className="cds--btn__icon"/></>}</PDFDownloadLink></div></>;
}

