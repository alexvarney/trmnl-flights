import { describe, it, expect } from "bun:test";
import { formatFlights } from "./trmnl-api";
import flightsFixture from "../fixtures/cykf-flights.json";

const mockArrival = flightsFixture.scheduled_arrivals[0];
const mockDeparture = flightsFixture.scheduled_departures[0];

describe("formatFlights", () => {
  it("should format flights", () => {
    const formattedFlights = formatFlights({
      arrivals: [mockArrival],
      departures: [mockDeparture],
    });

    expect(formattedFlights).toBeDefined();
    expect(formattedFlights.arrivals).toBeDefined();
    expect(formattedFlights.departures).toBeDefined();
  });

  it("should format arrival flights", () => {
    const formattedFlights = formatFlights({
      arrivals: [mockArrival],
      departures: [],
    });

    const formattedArrival = formattedFlights.arrivals[0];

    expect(formattedArrival).toBeDefined();
    expect(formattedArrival.displayName).toBe(mockArrival.ident);
    expect(formattedArrival.location).toBe(mockArrival.origin?.name);
    expect(formattedArrival.eta).toBe("Feb 15 – 03:35");
    expect(formattedArrival.status).toBe(mockArrival.status);
    expect(formattedArrival.aircraft).toBe(mockArrival.aircraft_type);
  });

  it("should format departure flights", () => {
    const formattedFlights = formatFlights({
      arrivals: [],
      departures: [mockDeparture],
    });

    const formattedDeparture = formattedFlights.departures[0];

    expect(formattedDeparture).toBeDefined();
    expect(formattedDeparture.displayName).toBe(mockDeparture.ident);
    expect(formattedDeparture.location).toBe(mockDeparture.destination?.name);
    expect(formattedDeparture.eta).toBe("Feb 15 – 03:50");
    expect(formattedDeparture.status).toBe(mockDeparture.status);
    expect(formattedDeparture.aircraft).toBe(mockDeparture.aircraft_type);
  });
});
