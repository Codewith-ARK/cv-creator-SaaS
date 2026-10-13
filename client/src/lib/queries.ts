import { useQuery } from "@tanstack/react-query";
import { getBlocks, getCVs, getSchemas } from "./api";

export function useWorkspace(userId?: number) {
  const enabled = Boolean(userId);
  const cvs = useQuery({ queryKey: ["cvs", userId], queryFn: ({ signal }) => getCVs(signal), enabled });
  const blocks = useQuery({ queryKey: ["blocks", userId], queryFn: ({ signal }) => getBlocks(signal), enabled });
  const schemas = useQuery({ queryKey: ["schemas", userId], queryFn: ({ signal }) => getSchemas(signal), enabled });
  return { cvs, blocks, schemas };
}
