import flightsFixture from "../fixtures/cykf-flights.json";
import { FlightsAPIResponse, Flight } from "./flights-api";

type FlightItemProps = {
  displayName: string;
  location: string;
  eta: string;
  status: string;
  aircraft: string;
};

export const postFlights = async (flights: {
  arrivals: Flight[];
  departures: Flight[];
}) => {
  const arrivals = flights.arrivals.map((f) => ({
    displayName: f.ident,
    location: f.origin?.name,
    eta: f.estimated_in,
    status: f.status,
    aircraft: f.aircraft_type,
  })) as FlightItemProps[];

  const departures = flights.departures.map((f) => ({
    displayName: f.ident,
    location: f.destination?.name,
    eta: f.estimated_out,
    status: f.status,
    aircraft: f.aircraft_type,
  })) as FlightItemProps[];

  const data = {
    merge_variables: {
      arrivals,
      departures,
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
