import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, getPersons as getSyntheticPersons, SyntheticFir, SyntheticPerson } from "../controllers/synthetic-firs.js";

export interface NetworkNode {
  id: string;
  label: string;
  type: "person" | "fir" | "location" | "crime_type" | "police_station" | "group";
  district?: string;
  crimeTypes?: string[];
  caseCount?: number;
  group?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  relationship: "INVOLVED_IN" | "OCCURRED_AT" | "ASSOCIATED_WITH" | "SAME_CRIME_TYPE" | "SAME_LOCATION" | "RELATED_CASE" | "SAME_MO" | "MEMBER_OF";
  strength?: number;
  caseId?: string;
}

export interface IntelligenceNetworkResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export async function getIntelligenceNetwork(params: {
  entityType?: string;
  district?: string;
  crimeType?: string;
  personId?: string;
  hops?: number;
  limit?: number;
}): Promise<IntelligenceNetworkResponse> {
  const hops = params.hops || 1;
  const limit = params.limit || 50;

  let allFirs: any[] = [];
  let allPersons: any[] = [];

  try {
    allFirs = await prisma.fir.findMany({ include: { persons: true } });
    allPersons = await prisma.person.findMany();
  } catch {
    allFirs = getSyntheticFirs().map((f: SyntheticFir) => ({
      ...f,
      persons: f.personIds.map((pid: string) => ({ personId: pid })),
    }));
    allPersons = getSyntheticPersons();
  }

  let filteredFirs = allFirs;
  if (params.district) filteredFirs = filteredFirs.filter((f) => f.district === params.district);
  if (params.crimeType) filteredFirs = filteredFirs.filter((f) => f.crimeType === params.crimeType);

  const nodesMap = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];
  const seenEdges = new Set<string>();

  // Add person nodes
  allPersons.forEach((p) => {
    if (params.district && p.district !== params.district) return;
    if (params.personId && p.id !== params.personId && hops === 1) {
      // Filter out if specific person requested with 1 hop
    }
    nodesMap.set(p.id, {
      id: p.id,
      label: p.alias || p.id,
      type: "person",
      district: p.district,
      crimeTypes: p.crimeTypes,
      group: p.group,
    });
  });

  // Hop expansion
  if (params.personId) {
    const rootId = params.personId;
    const connectedPersonIds = new Set<string>([rootId]);

    // Hop 1: FIRs linked to root person
    const hop1Firs = filteredFirs.filter((f) => f.persons.some((p: any) => p.personId === rootId));

    hop1Firs.forEach((f) => {
      // Add FIR node
      nodesMap.set(f.id, {
        id: f.id,
        label: f.firNumber || f.id,
        type: "fir",
        district: f.district,
        crimeTypes: [f.crimeType],
      });

      // Edge root -> FIR
      edges.push({ source: rootId, target: f.id, relationship: "INVOLVED_IN", caseId: f.id });

      // Connect co-accused
      f.persons.forEach((p: any) => {
        connectedPersonIds.add(p.personId);
        if (p.personId !== rootId) {
          edges.push({ source: p.personId, target: f.id, relationship: "INVOLVED_IN", caseId: f.id });
          const key = [rootId, p.personId].sort().join("--co--");
          if (!seenEdges.has(key)) {
            seenEdges.add(key);
            edges.push({ source: rootId, target: p.personId, relationship: "ASSOCIATED_WITH", caseId: f.id });
          }
        }
      });
    });

    // Hop 2 if requested
    if (hops >= 2) {
      const hop2Firs = filteredFirs.filter((f) => f.persons.some((p: any) => connectedPersonIds.has(p.personId)));
      hop2Firs.forEach((f) => {
        if (!nodesMap.has(f.id)) {
          nodesMap.set(f.id, {
            id: f.id,
            label: f.firNumber || f.id,
            type: "fir",
            district: f.district,
            crimeTypes: [f.crimeType],
          });
        }
        f.persons.forEach((p: any) => {
          if (connectedPersonIds.has(p.personId)) {
            edges.push({ source: p.personId, target: f.id, relationship: "INVOLVED_IN", caseId: f.id });
          }
        });
      });
    }
  } else {
    // General network graph view
    filteredFirs.slice(0, limit).forEach((fir) => {
      if (!nodesMap.has(fir.id)) {
        nodesMap.set(fir.id, {
          id: fir.id,
          label: fir.firNumber || fir.id,
          type: "fir",
          district: fir.district,
          crimeTypes: [fir.crimeType],
        });
      }

      // Add Location Node
      const locId = `LOC-${fir.policeStation.replace(/\s+/g, "_")}`;
      if (!nodesMap.has(locId)) {
        nodesMap.set(locId, {
          id: locId,
          label: fir.policeStation,
          type: "police_station",
          district: fir.district,
        });
      }

      edges.push({ source: fir.id, target: locId, relationship: "OCCURRED_AT" });

      // Add Person connections
      const pList = (fir.persons || []).map((p: any) => p.personId);
      pList.forEach((pid: string) => {
        if (nodesMap.has(pid)) {
          edges.push({ source: pid, target: fir.id, relationship: "INVOLVED_IN", caseId: fir.id });
        }
      });

      for (let i = 0; i < pList.length; i++) {
        for (let j = i + 1; j < pList.length; j++) {
          const key = [pList[i], pList[j]].sort().join("--co--");
          if (!seenEdges.has(key)) {
            seenEdges.add(key);
            edges.push({ source: pList[i], target: pList[j], relationship: "ASSOCIATED_WITH", caseId: fir.id });
          }
        }
      }
    });
  }

  // Filter nodes if entityType is specified
  let finalNodes = Array.from(nodesMap.values());
  if (params.entityType) {
    finalNodes = finalNodes.filter((n) => n.type === params.entityType);
  }

  return { nodes: finalNodes, edges };
}
