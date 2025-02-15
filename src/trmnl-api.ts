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

export const formatFlights = (flights: {
  arrivals: Flight[];
  departures: Flight[];
}) => {
  const arrivals = flights.arrivals.map((f) => ({
    displayName: f.ident,
    location: f.origin?.name,
    eta: formatEta(f.estimated_in),
    status: f.status,
    aircraft: f.aircraft_type,
  })) as FlightItemProps[];

  const departures = flights.departures.map((f) => ({
    displayName: f.ident,
    location: f.destination?.name,
    eta: formatEta(f.estimated_out),
    status: f.status,
    aircraft: f.aircraft_type,
  })) as FlightItemProps[];

  return { arrivals, departures };
};

export const postFlights = async (flights: {
  arrivals: FlightItemProps[];
  departures: FlightItemProps[];
}) => {
  const data = {
    merge_variables: {
      arrivals: flights.arrivals,
      departures: flights.departures,
    },
  };

  return await fetch(process.env.TRMNL_WEBHOOK as string, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
    },
  });
};
