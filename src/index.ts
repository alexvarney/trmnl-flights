import {
  fetchFlights,
  FlightsAPIResponse,
  readFlightsFromFile,
  writeFlights,
} from "./flights-api";
import { formatFlights, postFlights } from "./trmnl-api";
import { z } from "zod";

const Environment = z.object({
  AIRPORT_CODE: z.string(),
  FLIGHT_DATA_PATH: z.string(),
  TRMNL_WEBHOOK: z.string(),
  FLIGHTAWARE_API_KEY: z.string(),
  FLIGHTAWARE_FETCH_INTERVAL_MS: z.string().transform(Number),
  TRMNL_POST_INTERVAL_MS: z.string().transform(Number),
});

const env = Environment.parse(process.env);

const updateFlights = async (icaoCode: string) => {
  console.log("Updating flights for", icaoCode);

  const apiData = await fetchFlights(icaoCode);
  await writeFlights(icaoCode, apiData, env.FLIGHT_DATA_PATH);

  return apiData;
};

let flights: FlightsAPIResponse | null = null;

const startUpdater = (delay: number) => {
  setTimeout(async () => {
    updateFlights(env.AIRPORT_CODE).then((updatedData) => {
      flights = updatedData;
      updateTrmnl(env.AIRPORT_CODE);
    });

    setInterval(() => {
      updateFlights(env.AIRPORT_CODE).then((updatedData) => {
        flights = updatedData;
        updateTrmnl(env.AIRPORT_CODE);
      });
    }, env.FLIGHTAWARE_FETCH_INTERVAL_MS);
  }, delay);

  console.log("TRMNL Flight Updater Started...");
};

const updateTrmnl = async (icaoCode: string) => {
  console.log("Updating TRMNL for", icaoCode);

  const cachedFlights =
    flights ??
    (await readFlightsFromFile(icaoCode, env.FLIGHT_DATA_PATH))?.data;

  if (cachedFlights == null) {
    return;
  }

  const formattedFlights = formatFlights({
    arrivals: cachedFlights.scheduled_arrivals,
    departures: cachedFlights.scheduled_departures,
  });
  await postFlights(formattedFlights, icaoCode);
};

const main = async () => {
  const airport = env.AIRPORT_CODE;

  const cachedFlights = await readFlightsFromFile(
    airport,
    env.FLIGHT_DATA_PATH
  );

  if (cachedFlights) {
    const timestamp = new Date(cachedFlights.timestamp);
    const nextUpdate = timestamp.getTime() + env.FLIGHTAWARE_FETCH_INTERVAL_MS;

    const now = new Date();

    let timeRemaining = nextUpdate - now.getTime();

    if (timeRemaining <= 0) {
      timeRemaining = 0;
    } else {
      flights = cachedFlights.data;
    }

    startUpdater(timeRemaining);
  } else {
    startUpdater(0);
  }

  setInterval(() => updateTrmnl(airport), env.TRMNL_POST_INTERVAL_MS);
  updateTrmnl(airport);
};

main();

/*

Strategy notes:

- Fetch flights from flightaware every 4 hours
- Write that data to some file

- Every 5 minutes, read the file and format the data, post it to trmnl

*/
