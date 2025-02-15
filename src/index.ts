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
});

const env = Environment.parse(process.env);

const FLIGHTAWARE_FETCH_INTERVAL = 1000 * 60 * 60 * 4; // 4 hours
const TRMNL_POST_INTERVAL = 1000 * 60 * 5; // 5 minutes

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
    }, FLIGHTAWARE_FETCH_INTERVAL);
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
    const nextUpdate = timestamp.getTime() + FLIGHTAWARE_FETCH_INTERVAL;

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

  setInterval(() => updateTrmnl(airport), TRMNL_POST_INTERVAL);
  updateTrmnl(airport);
};

main();

/*

Strategy notes:

- Fetch flights from flightaware every 4 hours
- Write that data to some file

- Every 5 minutes, read the file and format the data, post it to trmnl

*/
