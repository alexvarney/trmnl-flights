import { mock } from "bun-bagel";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  setSystemTime,
} from "bun:test";
import YKFFlights from "../fixtures/cykf-flights.json";
import FlightsFixture from "../fixtures/flights-endpoint.json";
import {
  fetchFlights,
  FlightsAPIResponse,
  readFlightsFromFile,
  writeFlights,
} from "./flights-api";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

describe("flights api", () => {
  beforeAll(() => {
    mock("https://aeroapi.flightaware.com/aeroapi/airports/*", {
      data: YKFFlights,
    });

    setSystemTime(new Date("2025-02-14T20:47:08Z"));
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

describe("flights api file operations", () => {
  let tempDirPath: string;

  beforeAll(async () => {
    tempDirPath = await mkdtemp(join(tmpdir(), "flights-api-test-"));
  });

  afterAll(async () => {
    await rm(tempDirPath, { recursive: true, force: true });
  });

  it.only("should write and read flights to file", async () => {
    const airportCode = "CYKF";
    const mockFlights: FlightsAPIResponse = {
      arrivals: [],
      departures: [],
      scheduled_arrivals: [
        {
          ident: "TEST1234",
          fa_flight_id: "TEST1234-1234567890-airline-0000",
          status: "On time",
          type: "airline",
          operator: "Airline",
          registration: "TEST1234",
          origin: {
            code: "CYVR",
            name: "Vancouver International Airport",
            city: "Vancouver",
            timezone: "America/Vancouver",
          },
          destination: {
            code: "CYKF",
            name: "John F. Kennedy International Airport",
            city: "New York",
            timezone: "America/New_York",
          },
          aircraft_type: "B737",
          progress_percent: 50,
          estimated_in: "2024-01-01T00:00:00Z",
          estimated_out: "2024-01-01T00:00:00Z",
        },
      ],
      scheduled_departures: [],
      links: null,
      num_pages: 1,
    };

    await writeFlights(airportCode, mockFlights, tempDirPath);

    const filePath = join(
      tempDirPath,
      `${airportCode.toLowerCase()}-flights.json`
    );
    expect(await Bun.file(filePath).exists()).toBe(true);

    const fileContent = await Bun.file(filePath).text();
    const expectedContent = JSON.stringify(
      {
        timestamp: JSON.parse(fileContent).timestamp, // Use timestamp from written file
        data: mockFlights,
      },
      null,
      2
    );
    expect(JSON.parse(fileContent)).toEqual({
      code: airportCode.toLowerCase(),
      ...JSON.parse(expectedContent),
    });

    const readFlights = await readFlightsFromFile(
      airportCode,
      tempDirPath + "/"
    );
    expect(readFlights).toBeDefined();
    expect(readFlights?.data.scheduled_arrivals[0]?.ident).toEqual("TEST1234");
    expect(readFlights?.data.scheduled_arrivals[0]?.fa_flight_id).toEqual(
      "TEST1234-1234567890-airline-0000"
    );
  });

  it("should return null when reading from non-existent file", async () => {
    const airportCode = "NONEXISTENT";
    const readFlights = await readFlightsFromFile(
      airportCode,
      tempDirPath + "/"
    );
    expect(readFlights).toBeNull();
  });
});
