import { fetchFlights, writeFlightsToFile } from "./flights-api";
import { postFlights } from "./trmnl-api";

const main = async () => {
  const flights = await fetchFlights("CYKF");
  await postFlights({
    arrivals: flights.scheduled_arrivals,
    departures: flights.scheduled_departures,
  });
  writeFlightsToFile("CYKF", flights);
};

main();
