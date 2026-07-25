import { Router, type IRouter } from "express";
import { getFirs, getPersons, DISTRICTS } from "../data/synthetic-firs.js";

const router: IRouter = Router();

router.get("/network", async (req, res): Promise<void> => {
  const { personId, crimeType, district } = req.query as Record<string, string>;

  const allFirs = getFirs();
  const allPersons = getPersons();

  // Filter FIRs
  let filteredFirs = allFirs.filter((f) => f.personIds.length > 0);
  if (crimeType) filteredFirs = filteredFirs.filter((f) => f.crimeType === crimeType);
  if (district) filteredFirs = filteredFirs.filter((f) => f.district === district);

  // If personId specified, only return related nodes
  let relevantPersonIds: Set<string> = new Set();
  if (personId) {
    relevantPersonIds.add(personId);
    // Find all FIRs containing this person
    const relatedFirs = filteredFirs.filter((f) => f.personIds.includes(personId));
    relatedFirs.forEach((f) => f.personIds.forEach((p) => relevantPersonIds.add(p)));
  } else {
    filteredFirs.forEach((f) => f.personIds.forEach((p) => relevantPersonIds.add(p)));
  }

  // Cap to avoid massive graphs
  const personIdList = Array.from(relevantPersonIds).slice(0, 40);

  // Build nodes
  const nodes = personIdList.map((pid) => {
    const person = allPersons.find((p) => p.id === pid);
    const personFirs = filteredFirs.filter((f) => f.personIds.includes(pid));
    const districtName = DISTRICTS.find((d) => d.id === person?.district)?.name ?? person?.district ?? "Unknown";
    return {
      id: pid,
      label: person?.alias ?? pid,
      type: "person" as const,
      caseCount: personFirs.length,
      district: districtName,
      crimeTypes: person?.crimeTypes ?? [],
      group: person?.group ?? 0,
    };
  });

  // Build edges
  const edges: Array<{
    source: string;
    target: string;
    relationship: "co_accused" | "same_mo" | "shared_location" | "linked_case";
    caseId?: string;
  }> = [];

  const seenEdges = new Set<string>();

  filteredFirs.forEach((fir) => {
    const firPersons = fir.personIds.filter((pid) => personIdList.includes(pid));
    // Co-accused edges
    for (let i = 0; i < firPersons.length; i++) {
      for (let j = i + 1; j < firPersons.length; j++) {
        const key = [firPersons[i], firPersons[j]].sort().join("--");
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({
            source: firPersons[i],
            target: firPersons[j],
            relationship: "co_accused",
            caseId: fir.id,
          });
        }
      }
    }
  });

  // Add same-MO edges (persons with same crime type from different FIRs)
  const personsByType: Record<string, string[]> = {};
  nodes.forEach((n) => {
    n.crimeTypes.forEach((ct) => {
      if (!personsByType[ct]) personsByType[ct] = [];
      personsByType[ct].push(n.id);
    });
  });

  Object.values(personsByType).forEach((pids) => {
    for (let i = 0; i < Math.min(pids.length, 5); i++) {
      for (let j = i + 1; j < Math.min(pids.length, 5); j++) {
        const key = [pids[i], pids[j]].sort().join("--mo--");
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({
            source: pids[i],
            target: pids[j],
            relationship: "same_mo",
          });
        }
      }
    }
  });

  res.json({ nodes, edges });
});

export default router;
