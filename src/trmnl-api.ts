import { Flight } from "./flights-api";

type FlightItemProps = {
  displayName: string;
  location: string;
  eta: string;
  status: string;
  aircraft: string;
};

const formatEta = (eta: string | null) => {
  if (!eta) {
    return "";
  }

  const date = new Date(eta);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.toLocaleDateString("en-US", { day: "numeric" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${month} ${day} – ${time}`;
};

const isFlightStale = (flight: Flight, type: "arrival" | "departure") => {
  const now = new Date();
  //filter flights out that were expected to arrive or depart more than 10m ago
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const estimatedIn = flight.estimated_in
    ? new Date(flight.estimated_in)
    : new Date();

  if (estimatedIn < tenMinutesAgo) return true;

  if (flight.status === "Arrived") return true;

  if (type === "arrival" && flight.estimated_in == null) return true;

  if (type === "departure" && flight.estimated_out == null) return true;

  return false;
};

export const formatFlights = (flights: {
  arrivals: Flight[];
  departures: Flight[];
}) => {
  const arrivals = flights.arrivals
    .filter((f) => !isFlightStale(f, "arrival"))
    .map((f) => ({
      displayName: f.ident,
      location: f.origin?.name,
      eta: formatEta(f.estimated_in),
      status: f.status,
      aircraft: f.aircraft_type,
    })) as FlightItemProps[];

  const departures = flights.departures
    .filter((f) => !isFlightStale(f, "departure"))
    .map((f) => ({
      displayName: f.ident,
      location: f.destination?.name,
      eta: formatEta(f.estimated_out),
      status: f.status,
      aircraft: f.aircraft_type,
    })) as FlightItemProps[];

  return { arrivals, departures };
};

export const postFlights = async (
  flights: {
    arrivals: FlightItemProps[];
    departures: FlightItemProps[];
  },
  airportCode: string,
  endpoint = process.env.TRMNL_WEBHOOK as string
) => {
  const data = {
    merge_variables: {
      arrivals: flights.arrivals,
      departures: flights.departures,
      airportCode,
    },
  };

  return await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
    },
  });
};
