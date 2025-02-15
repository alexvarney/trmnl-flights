import z from "zod";
import path from "path";
import { env } from "bun";
import fs from "fs/promises";

export const Airport = z
  .object({
    code: z.string().nullable(),
    name: z.string().nullable(),
    city: z.string().nullable(),
    timezone: z.string().nullable(),
  })
  .passthrough();

export const Flight = z
  .object({
    fa_flight_id: z.string(),
    ident: z.string().nullable(),
    operator: z.string().nullable(),
    registration: z.string().nullable(),
    origin: Airport.nullable(),
    destination: Airport.nullable(),
    aircraft_type: z.string().nullable(),
    status: z.string().nullable(),
    progress_percent: z.number().nullable(),
    type: z.string().nullable(),
    estimated_in: z.string().nullable(),
    estimated_out: z.string().nullable(),
  })
  .passthrough();

export type Flight = z.infer<typeof Flight>;

export const FlightsAPIResponse = z
  .object({
    arrivals: z.array(Flight),
    departures: z.array(Flight),
    scheduled_arrivals: z.array(Flight),
    scheduled_departures: z.array(Flight),
    links: z
      .object({
        next: z.string(),
      })
      .nullable(),
    num_pages: z.number(),
  })
  .passthrough();

export type FlightsAPIResponse = z.infer<typeof FlightsAPIResponse>;

const SerializedFlights = z.object({
  timestamp: z.string(),
  data: FlightsAPIResponse,
});

export type SerializedFlights = z.infer<typeof SerializedFlights>;

const getTimeString = (date: Date) => {
  const isoString = date.toISOString();
  const withoutMilliseconds = isoString.substring(0, 19) + "Z";

  return withoutMilliseconds;
};

export const fetchFlights = async (airportCode: string) => {
  const params = new URLSearchParams({
    start: getTimeString(new Date()),
    end: getTimeString(new Date(Date.now() + 1000 * 60 * 60 * 12)),
  });

  const url = `https://aeroapi.flightaware.com/aeroapi/airports/${airportCode}/flights?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "x-Apikey": process.env.FLIGHTAWARE_API_KEY as string,
    },
  }).then((res) => res.json());

  return FlightsAPIResponse.parse(response);
};

export const writeFlights = async (
  icaoCode: string,
  flights: FlightsAPIResponse,
  dataDir: string
) => {
  const code = icaoCode.toLowerCase();

  const tempFilePath = path.join(dataDir, `${code}-flights-temp.json`);
  const finalFilePath = path.join(dataDir, `${code}-flights.json`);

  // Write to a temporary file using Bun.write
  try {
    await Bun.write(
      tempFilePath,
      JSON.stringify({
        code,
        data: flights,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error writing to temp file:", error);
    return; // Exit early if writing fails
  }

  try {
    await fs.rename(tempFilePath, finalFilePath);
  } catch (error) {
    console.error("Error renaming file:", error);
    // Handle the error appropriately.  Maybe retry, or log and exit.
    // Consider deleting the temp file if the rename fails.
    try {
      await Bun.file(tempFilePath)
        .exists()
        .then(async (exists) => {
          if (exists) {
            await Bun.file(tempFilePath).delete();
          }
        });
    } catch (unlinkError) {
      console.error("Error deleting temp file:", unlinkError);
    }
  }
};

export const readFlightsFromFile = async (
  airportCode: string,
  path: string
) => {
  try {
    const data = await Bun.file(
      `${path}${airportCode.toLowerCase()}-flights.json`
    ).json();
    return SerializedFlights.parse(data);
  } catch (error) {
    console.error(error);
    return null;
  }
};
