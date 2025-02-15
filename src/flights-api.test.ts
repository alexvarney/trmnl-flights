import { mock } from "bun-bagel";
import { beforeAll, describe, expect, it } from "bun:test";
import YKFFlights from "../fixtures/cykf-flights.json";
import FlightsFixture from "../fixtures/flights-endpoint.json";
import { fetchFlights, FlightsAPIResponse } from "./flights-api";

describe("flights api", () => {
  beforeAll(() => {
    mock("https://aeroapi.flightaware.com/aeroapi/airports/*", {
      data: YKFFlights,
    });
  });

  it("should parse the flights fixture data", () => {
    const response = FlightsAPIResponse.parse(FlightsFixture);

    expect(response).toBeDefined();
  });

  it("should have api key available", () => {
    expect(process.env.FLIGHTAWARE_API_KEY).toBeDefined();
  });

  it("should fetch flights", async () => {
    const flights = await fetchFlights("CYKF");

    expect(flights).toBeDefined();

    expect(
      flights.scheduled_arrivals.find((f) => f.ident === "FLE2401")
        ?.fa_flight_id
    ).toBe("FLE2401-1739342011-airline-1495p");
  });
});
