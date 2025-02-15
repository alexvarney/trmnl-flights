import { fetchFlights } from "./flights-api";
import { formatFlights, postFlights } from "./trmnl-api";

const main = async () => {
  const flights = await fetchFlights("CYKF");

  const formatted = formatFlights({
    arrivals: flights.scheduled_arrivals,
    departures: flights.scheduled_departures,
  });

  await postFlights(formatted);
};

main();
