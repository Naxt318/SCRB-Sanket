import { DISTRICTS } from "../controllers/synthetic-firs.js";

export interface SocioeconomicDataResponse {
  district: string;
  districtName: string;
  population: number;
  populationDensity: number; // per sq km
  urbanizationRate: number; // %
  unemploymentRate: number; // %
  literacyRate: number; // %
  crimeRatePer100k: number;
  statisticalCorrelation: string;
}

export async function getSocioeconomicContext(districtId?: string): Promise<SocioeconomicDataResponse[]> {
  const targetDistricts = districtId ? DISTRICTS.filter((d) => d.id === districtId) : DISTRICTS;

  const data: Record<string, Omit<SocioeconomicDataResponse, "district" | "districtName">> = {
    bengaluru_urban: {
      population: 12500000,
      populationDensity: 4381,
      urbanizationRate: 90.9,
      unemploymentRate: 4.8,
      literacyRate: 87.7,
      crimeRatePer100k: 182.4,
      statisticalCorrelation: "High population density & rapid urbanization exhibit a positive statistical association with property & cyber crime volume.",
    },
    mysuru: {
      population: 3000000,
      populationDensity: 476,
      urbanizationRate: 41.5,
      unemploymentRate: 5.2,
      literacyRate: 72.8,
      crimeRatePer100k: 110.2,
      statisticalCorrelation: "Moderate urbanization with seasonal tourism exhibits localized spatiotemporal theft clustering.",
    },
    dakshina_kannada: {
      population: 2080000,
      populationDensity: 430,
      urbanizationRate: 47.7,
      unemploymentRate: 4.1,
      literacyRate: 88.6,
      crimeRatePer100k: 125.6,
      statisticalCorrelation: "High literacy combined with coastal transit hubs exhibits statistical association with financial & narcotics cases.",
    },
    tumakuru: {
      population: 2670000,
      populationDensity: 253,
      urbanizationRate: 22.4,
      unemploymentRate: 6.1,
      literacyRate: 75.1,
      crimeRatePer100k: 94.8,
      statisticalCorrelation: "Highway transit corridors show localized correlation with vehicle theft & burglary rates.",
    },
    belagavi: {
      population: 4770000,
      populationDensity: 356,
      urbanizationRate: 25.3,
      unemploymentRate: 5.8,
      literacyRate: 73.5,
      crimeRatePer100k: 105.3,
      statisticalCorrelation: "Inter-state border proximity exhibits statistical correlation with multi-jurisdictional property offences.",
    },
    kalaburagi: {
      population: 2560000,
      populationDensity: 233,
      urbanizationRate: 32.6,
      unemploymentRate: 7.2,
      literacyRate: 65.1,
      crimeRatePer100k: 118.9,
      statisticalCorrelation: "Socioeconomic vulnerabilities show statistical correlation with seasonal dispute and assault frequencies.",
    },
  };

  return targetDistricts.map((d) => {
    const info = data[d.id] || data["bengaluru_urban"];
    return {
      district: d.id,
      districtName: d.name,
      ...info,
    };
  });
}
