import z from "zod";

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
  })
  .passthrough();

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

type FlightsAPIResponse = z.infer<typeof FlightsAPIResponse>;

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
