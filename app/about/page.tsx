import type { Metadata } from "next";
import { ProseArticle } from "@/components/ProseArticle";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `About the method | ${SITE_NAME}` },
  description: "How IsItRainingNow combines Open-Meteo observations, deterministic hazard formulas, and local infrastructure context.",
};

export default function AboutPage() {
  return (
    <main>
      <ProseArticle kicker="Method" heading="How the desks are built">
        <p>{SITE_NAME} is a live weather and hazard desk. Each city page answers one decision: rain in the next minutes, snow and black ice, heat and UV, wind chill, storm gusts, pipes, roof and hail, barometric pressure, or cold-weather EV range. Stadium pages answer whether an open ground is likely to lose time.</p>
        <p>The live hour comes from the Open-Meteo forecast and air-quality APIs, requested together and cached for fifteen minutes. Coordinates and time zone come from Open-Meteo geocoding, not from a model. Units follow the country: imperial for the United States, a UK hybrid of Celsius, miles per hour, millimetres, and hectopascals for the United Kingdom, and metric elsewhere. The weather agency named on the page is assigned the same way: NOAA, the UK Met Office, Environment Canada, the Bureau of Meteorology, the India Meteorological Department, or the national service.</p>
        <p>Hazard scores are deterministic. Dew point uses the Alduchov–Eskridge approximation. Wind chill and frostbite anchors follow National Weather Service thresholds. Wet-bulb globe temperature follows a Bureau of Meteorology style estimate with a capped solar term. Sunburn time uses a Fitzpatrick type II rule of thumb. Pavement temperature can run hotter than air in full sun, and that estimate is labeled as an estimate. EV range loss and tire-pressure drop are published cold-weather rules of thumb, not a reading from your car. Gutter flow assumes a 1,500 square foot roof and a 0.95 runoff coefficient.</p>
        <p>The first time a city is opened, a structured model fills six neighborhoods, the local transit system, airports, flood corridors, a housing note, and a climate summary. Those strings are checked against geocoding before they are stored. An airport code that does not sit near the airport name is dropped. The model does not invent the temperature. After that first visit, the page reads the stored place and refreshes only the weather.</p>
        <p>Neighborhood rows are separate forecast points, so a suburb can differ from the center by a degree or by a shower. If a coordinate does not return a current hour, that row is omitted instead of being shown as zero. Pollen is requested where the air-quality feed supports it and left empty elsewhere. An empty pollen series is not treated as a high count.</p>
        <p>What the desk will not fabricate: a hailstone diameter, a utility outage map, or a six-hour pressure drop on the homepage boards. Hail is a probability from CAPE, freezing level, and weather code. Storm copy talks about gusts and convective potential. The homepage pressure board ranks the lowest stored surface pressure. The six-hour and twenty-four-hour change is computed on the city pressure desk, where the hourly series is available.</p>
        <p>Stadium drainage starts from the recovery time written on the venue record. A covered roof is treated as covered only when the roof type says dome, fixed, or closed. An open-air ground stays exposed. Toss-delay and DLS figures are probabilities from the rain already falling and the next hours, not a confirmation from the match referee.</p>
        <p>The long briefing under the dashboard repeats those live numbers in sentences, with the neighborhood table, the transit system, the airports, and the flood corridors. It is ordinary HTML so it can be read, indexed, and, when advertising is enabled, spaced for in-content placements. The interactive cards above it stay compact so the first screen still answers the question.</p>
      </ProseArticle>
    </main>
  );
}
