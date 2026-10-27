export class PlacesError extends Error {
  status: number;
  constructor(message: string, status?: number);
}

export function searchPlaces(
  input: unknown,
): Promise<{ places: Array<{
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  social: string;
  category: string;
}>; total: number }>;
