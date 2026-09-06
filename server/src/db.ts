const databaseUnavailable = new Error(
  "DATABASE_URL is not configured; using the in-memory demo data",
);

const unavailableModel = new Proxy(
  {},
  {
    get: () => async () => {
      throw databaseUnavailable;
    },
  },
);

const unavailablePrisma = new Proxy(
  {},
  {
    get: (_target, property) => {
      if (property === "then") return undefined;
      if (typeof property === "string" && property.startsWith("$")) {
        return async () => {
          throw databaseUnavailable;
        };
      }
      return unavailableModel;
    },
  },
);

let databaseClient: any = unavailablePrisma;

if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    databaseClient = new PrismaClient();
  } catch (error) {
    console.warn("[SCRB Backend] Prisma unavailable; using demo data", error);
  }
}

export const prisma: any = databaseClient;
