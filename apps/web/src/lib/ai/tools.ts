type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

type ToolResult = {
  tool: string;
  ok: boolean;
  data: JSONValue;
};

const placeSeed = [
  { name: "Dal Lake", category: "lake", location: "Srinagar", rating: 4.8 },
  { name: "Gulmarg Gondola", category: "tourism", location: "Gulmarg", rating: 4.7 },
  { name: "Pahalgam Riverfront", category: "tourism", location: "Pahalgam", rating: 4.6 },
  { name: "Hazratbal", category: "religious", location: "Srinagar", rating: 4.7 },
  { name: "Lal Chowk", category: "market", location: "Srinagar", rating: 4.3 }
];

export const anthropicTools: Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> = [
  {
    name: "search_places",
    description: "Search Kashmir places by query/category/location.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        location: { type: "string" }
      },
      required: ["query", "category"]
    }
  },
  {
    name: "get_directions",
    description: "Get route, ETA and turn steps.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" }
      },
      required: ["from", "to"]
    }
  },
  {
    name: "find_emergency_services",
    description: "Find nearest emergency services in Kashmir.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["hospital", "police", "ambulance"] },
        location: { type: "string" }
      },
      required: ["type", "location"]
    }
  },
  {
    name: "generate_itinerary",
    description: "Generate day-by-day Kashmir itinerary.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number" },
        budget: { type: "number" },
        interests: { type: "array", items: { type: "string" } },
        startLocation: { type: "string" }
      },
      required: ["days", "budget", "interests", "startLocation"]
    }
  },
  {
    name: "get_weather",
    description: "Get current weather and 5-day forecast.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string" }
      },
      required: ["location"]
    }
  },
  {
    name: "search_storefronts",
    description: "Search Kashmir Connect merchants by sector and query.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        sector: { type: "string" }
      },
      required: ["query", "sector"]
    }
  },
  {
    name: "translate_text",
    description: "Translate text to requested language.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        targetLanguage: { type: "string", enum: ["ur", "hi", "ks", "en"] }
      },
      required: ["text", "targetLanguage"]
    }
  },
  {
    name: "get_government_service",
    description: "Get J&K government service or scheme guidance.",
    input_schema: {
      type: "object",
      properties: {
        department: { type: "string" },
        query: { type: "string" }
      },
      required: ["department", "query"]
    }
  }
];

function fakeTranslate(text: string, targetLanguage: "ur" | "hi" | "ks" | "en"): string {
  if (targetLanguage === "en") return text;
  if (targetLanguage === "ur") return `اردو ترجمہ: ${text}`;
  if (targetLanguage === "hi") return `हिंदी अनुवाद: ${text}`;
  return `کٲشُر: ${text}`;
}

export async function executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case "search_places": {
        const query = String(input.query ?? "");
        const category = String(input.category ?? "");
        const location = input.location ? String(input.location) : undefined;
        const places = placeSeed
          .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(category.toLowerCase()))
          .map((item, idx) => ({
            ...item,
            id: `pl-${idx + 1}`,
            location: location ?? item.location
          }));
        return { tool: name, ok: true, data: { places } };
      }
      case "get_directions": {
        const from = String(input.from ?? "");
        const to = String(input.to ?? "");
        return {
          tool: name,
          ok: true,
          data: {
            from,
            to,
            distanceKm: 43,
            etaMinutes: 78,
            steps: ["Head toward NH44", "Continue to Tangmarg", "Follow signs to destination"]
          }
        };
      }
      case "find_emergency_services": {
        const type = String(input.type ?? "hospital");
        const location = String(input.location ?? "Srinagar");
        return {
          tool: name,
          ok: true,
          data: {
            type,
            location,
            nearest: [
              { name: `${type.toUpperCase()} Response Center 1`, phone: "112", distanceKm: 1.8 },
              { name: `${type.toUpperCase()} Response Center 2`, phone: "112", distanceKm: 3.4 },
              { name: `${type.toUpperCase()} Response Center 3`, phone: "112", distanceKm: 6.1 }
            ]
          }
        };
      }
      case "generate_itinerary": {
        const days = Number(input.days ?? 3);
        const startLocation = String(input.startLocation ?? "Srinagar");
        return {
          tool: name,
          ok: true,
          data: {
            summary: `${days}-day Kashmir trip from ${startLocation}`,
            days: Array.from({ length: days }, (_, i) => ({
              day: i + 1,
              plan: i === 0 ? "Dal Lake + old city walk" : i === 1 ? "Gulmarg day trip" : "Pahalgam exploration"
            }))
          }
        };
      }
      case "get_weather": {
        const location = String(input.location ?? "Srinagar");
        return {
          tool: name,
          ok: true,
          data: {
            location,
            current: { tempC: 18, condition: "Partly cloudy" },
            forecast: [
              { day: "D1", tempC: 17, condition: "Cloudy" },
              { day: "D2", tempC: 19, condition: "Sunny intervals" },
              { day: "D3", tempC: 16, condition: "Light rain" },
              { day: "D4", tempC: 18, condition: "Clear" },
              { day: "D5", tempC: 20, condition: "Sunny" }
            ]
          }
        };
      }
      case "search_storefronts": {
        const query = String(input.query ?? "");
        const sector = String(input.sector ?? "handicrafts");
        return {
          tool: name,
          ok: true,
          data: {
            merchants: [
              { name: "Kashmir Crafts House", sector, slug: "kashmir-crafts-house", match: query },
              { name: "Valley Organic Hub", sector, slug: "valley-organic-hub", match: query },
              { name: "Snowpeak Tourism Co", sector, slug: "snowpeak-tourism-co", match: query }
            ]
          }
        };
      }
      case "translate_text": {
        const text = String(input.text ?? "");
        const targetLanguage = (String(input.targetLanguage ?? "en") as "ur" | "hi" | "ks" | "en");
        return { tool: name, ok: true, data: { translated: fakeTranslate(text, targetLanguage), targetLanguage } };
      }
      case "get_government_service": {
        const department = String(input.department ?? "General");
        const query = String(input.query ?? "");
        return {
          tool: name,
          ok: true,
          data: {
            department,
            query,
            guidance: [
              "Check district e-governance portal",
              "Carry Aadhaar + domicile documents",
              "Submit online form and track by reference ID"
            ]
          }
        };
      }
      default:
        return { tool: name, ok: false, data: { error: "Unknown tool" } };
    }
  } catch (error) {
    return { tool: name, ok: false, data: { error: error instanceof Error ? error.message : "Tool execution failed" } };
  }
}
