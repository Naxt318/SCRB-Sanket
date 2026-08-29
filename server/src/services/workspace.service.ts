import { prisma } from "../db.js";

export interface InvestigationWorkspaceData {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string;
  district: string;
  createdAt: string;
  firs: any[];
  persons: any[];
  findings: any[];
}

const memoryWorkspaces: InvestigationWorkspaceData[] = [
  {
    id: "INV-001",
    title: "Bengaluru Urban Chain Snatching Taskforce",
    description: "Multi-jurisdictional investigation targeting recurring two-wheeler pillion snatching across Koramangala & Indiranagar.",
    status: "active",
    assignedTo: "Insp. R. Kumar",
    district: "Bengaluru Urban",
    createdAt: "2026-07-20T10:00:00Z",
    firs: [
      { id: "FIR-0001", firNumber: "KA-BEN/2026/07/CR/101", crimeType: "Chain Snatching", policeStation: "Koramangala PS", dateOfIncident: "2026-07-22" },
      { id: "FIR-0002", firNumber: "KA-BEN/2026/07/CR/102", crimeType: "Chain Snatching", policeStation: "Indiranagar PS", dateOfIncident: "2026-07-21" },
    ],
    persons: [
      { id: "POI-001", alias: "Subject-001", district: "bengaluru_urban", crimeTypes: ["Chain Snatching"] },
      { id: "POI-004", alias: "Subject-004", district: "bengaluru_urban", crimeTypes: ["Chain Snatching", "Theft"] },
    ],
    findings: [
      { id: "FND-01", title: "Spatial Clustering", findingType: "GEOGRAPHIC_Hotspot", content: "89% of incidents occur within 2.5 km radius during 21:00-23:00 hours.", confidence: 0.92 },
      { id: "FND-02", title: "Co-Accused Association", findingType: "NETWORK_LINK", content: "POI-001 and POI-004 share co-occurrence in 3 separate FIR records.", confidence: 0.88 },
    ],
  },
];

export async function getInvestigations(): Promise<InvestigationWorkspaceData[]> {
  try {
    const list = await prisma.investigation.findMany({
      include: {
        firs: { include: { fir: true } },
        persons: { include: { person: true } },
        findings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return list.map((inv: any) => ({
      id: inv.id,
      title: inv.title,
      description: inv.description,
      status: inv.status,
      assignedTo: inv.assignedTo,
      district: inv.district,
      createdAt: inv.createdAt.toISOString(),
      firs: inv.firs.map((f: any) => f.fir),
      persons: inv.persons.map((p: any) => p.person),
      findings: inv.findings,
    }));
  } catch {
    return memoryWorkspaces;
  }
}

export async function createInvestigation(data: {
  title: string;
  description: string;
  assignedTo: string;
  district: string;
  firIds?: string[];
  personIds?: string[];
}): Promise<InvestigationWorkspaceData> {
  const newId = `INV-${String(memoryWorkspaces.length + 1).padStart(3, "0")}`;

  try {
    const created = await prisma.investigation.create({
      data: {
        id: newId,
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        district: data.district,
        firs: {
          create: (data.firIds || []).map((firId) => ({ firId })),
        },
        persons: {
          create: (data.personIds || []).map((personId) => ({ personId })),
        },
      },
      include: {
        firs: { include: { fir: true } },
        persons: { include: { person: true } },
        findings: true,
      },
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      status: created.status,
      assignedTo: created.assignedTo,
      district: created.district,
      createdAt: created.createdAt.toISOString(),
      firs: created.firs.map((f: any) => f.fir),
      persons: created.persons.map((p: any) => p.person),
      findings: created.findings,
    };
  } catch {
    const memItem: InvestigationWorkspaceData = {
      id: newId,
      title: data.title,
      description: data.description,
      status: "active",
      assignedTo: data.assignedTo,
      district: data.district,
      createdAt: new Date().toISOString(),
      firs: (data.firIds || []).map((id) => ({ id, firNumber: `FIR-${id}`, crimeType: "Chain Snatching" })),
      persons: (data.personIds || []).map((id) => ({ id, alias: `Subject-${id}` })),
      findings: [
        { id: `FND-${Date.now()}`, title: "Initial Workspace Creation", findingType: "CASE_CORRELATION", content: "Attached cases and suspects for investigation.", confidence: 0.85 },
      ],
    };
    memoryWorkspaces.unshift(memItem);
    return memItem;
  }
}
