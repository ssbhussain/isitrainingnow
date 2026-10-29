import type { IirnCity } from "@/lib/city-provisioner";
import { fmt, num } from "@/lib/format";
import { CITY_SILOS } from "@/lib/silos";
import type { WeatherIntelligence } from "@/lib/weather-engine";
import { ProseArticle } from "@/components/ProseArticle";

export function CityBriefing({ city, weather }: { city: IirnCity; weather: WeatherIntelligence }) {
  const current = weather.current;
  const timer = weather.modules.minuteTimer;
  const winter = weather.modules.winter;
  const summer = weather.modules.summer;
  const pipes = weather.modules.pipeAndFlood;
  const roof = weather.modules.roofAndGutter;
  const pressure = weather.modules.pressureHealth;
  const commute = weather.modules.commuteAndEv;
  const cells = weather.modules.neighborhoodGrid.cells;
  const airports = (city.local_airports ?? []).map((airport) => `${airport.name} (${airport.iata_code})`).join(", ") || "no mapped commercial airport on file";
  const hotspots = city.flood_and_traffic_hotspots ?? [];
  const transit = city.local_transit_system || "the local transit network";
  const climate = city.climate_summary;
  const hourly = weather.hourlyWindow.slice(0, 8);

  const paragraphs = [
    `${city.name}${city.state_region ? `, ${city.state_region}` : ""}, ${city.country} is on the ${city.weather_agency} desk at ${weather.observationTime} ${weather.timezone}. The live status is ${timer.status}. Air temperature is ${fmt(current.temperature)}, feels-like temperature is ${fmt(current.apparentTemperature)}, and relative humidity is ${num(current.relativeHumidityPct, 0)} percent. Wind is ${fmt(current.windSpeed)} from ${num(current.windDirectionDeg, 0)} degrees, with gusts at ${fmt(current.windGust)}. Mean sea-level pressure is ${fmt(current.pressureMsl, 2)} and surface pressure is ${fmt(current.surfacePressure, 2)}.`,
    `Precipitation on the current hour is ${fmt(current.precipitation)}, split as rain ${fmt(current.rain)} and showers ${fmt(current.showers)}. Snowfall is ${fmt(current.snowfall)}. The past six hours accumulated ${fmt(timer.past6hRain)} of liquid and ${fmt(timer.past6hSnow)} of snow. The past twenty-four hours accumulated ${fmt(timer.past24hRain)} of liquid and ${fmt(timer.past24hSnow)} of snow. Cloud cover is ${num(current.cloudCoverPct, 0)} percent, visibility is ${fmt(current.visibility)}, and the UV index is ${num(current.uvIndex, 1)}.`,
    `The minute timer uses ${timer.resolutionMinutes}-minute steps. Change state is "${timer.change}". ${timer.minutesUntilChange == null ? "No start or stop falls inside the next six hours." : `The next change is ${timer.minutesUntilChange} minutes away.`} The next dry window is ${timer.nextDryWindowMinutes ?? 0} minutes. ${timer.summary}`,
    `${transit} is the commute system this briefing uses. Wet platforms, flooded approaches, and gusty exposed track matter more than a single city-center number. Airports on file: ${airports}. A ground stop or a soaked taxiway queue follows the same rain rate travelers see on the city timer, so the airport reading and the neighborhood grid should be checked together before a departure.`,
    hotspots.length
      ? `Flood and traffic corridors stored for ${city.name} are ${hotspots.join("; ")}. Each named corridor is where standing water, a low underpass, or a merge usually appears before the citywide total looks dramatic. Use the six-hour rain total of ${fmt(timer.past6hRain)} as the saturation context for those roads.`
      : `${city.name} does not yet have a stored list of flood corridors. The six-hour rain total of ${fmt(timer.past6hRain)} is still the number to compare with the usual underpasses on your own route.`,
    `Pipe-burst level is ${pipes.pipeBurst.level}. Consecutive hours at or below ${fmt(pipes.pipeBurst.threshold)} number ${pipes.pipeBurst.consecutiveHoursAtOrBelowThreshold}, with ${pipes.pipeBurst.upcomingHoursAtOrBelowThreshold} hours in the next cold run that starts within twelve hours. Soil temperature at the surface is ${fmt(pipes.pipeBurst.soilTemperature)} and wind chill is ${fmt(pipes.pipeBurst.windChill)}. ${city.housing_and_pipe_profile ?? `${city.name} housing stock is described on the city record when the local profile is stored.`}`,
    `Sump-pump and basement waterlogging is ${pipes.sumpPump.level}. Soil moisture in the top centimetre is ${num(pipes.sumpPump.soilMoistureM3, 2)} cubic metres per cubic metre, and liquid rain over twenty-four hours is ${fmt(pipes.sumpPump.rain24h)}. That pair is the basement number: moisture already in the soil, plus the rain that has to go somewhere.`,
    `Hail probability is ${roof.hailProbabilityPct} percent (${roof.hailLevel}). This desk does not invent a hailstone diameter. It reports convective potential from CAPE ${num(roof.capeJkg, 0)} joules per kilogram, freezing level ${fmt(roof.freezingLevel, 0)}, and weather code ${num(roof.weatherCode, 0)}. Shingle wind-uplift risk is ${roof.shingleUplift.level} at a gust of ${fmt(roof.shingleUplift.gust)}.`,
    `Gutter flow assumes a 1,500 square foot roof and a runoff coefficient of 0.95. At the current rain rate of ${fmt(roof.gutter.rainRate)}, that roof sheds about ${fmt(roof.gutter.flow, 0)}. Use it as an overflow check for downspouts during the present hour, not as a certified hydraulic design.`,
    `Barometric change is ${fmt(pressure.delta6h, 2)} over six hours and ${fmt(pressure.delta24h, 2)} over twenty-four hours. Migraine and sinus classification is ${pressure.migraineRisk}. A severe trigger is reserved for an absolute change of at least 5 hPa. The arthritis joint-flare index is ${pressure.arthritisIndex} out of 100 (${pressure.arthritisLevel}), combining humidity of ${num(current.relativeHumidityPct, 0)} percent with a pressure drop when one is present.`,
    `The outdoor window for asthma and pollen is ${pressure.safeOutdoorWindow.safe ? "open" : "limited"} from ${pressure.safeOutdoorWindow.start ?? "no start"} to ${pressure.safeOutdoorWindow.end ?? "no end"}. Limiting factor: ${pressure.safeOutdoorWindow.limitingFactor}. US AQI is ${num(current.usAqi, 0)}. PM2.5 is ${fmt(current.pm2_5, 1)} and PM10 is ${fmt(current.pm10, 1)}. Pollen grains per cubic metre are alder ${num(current.pollenGrainsM3.alder, 0)}, birch ${num(current.pollenGrainsM3.birch, 0)}, grass ${num(current.pollenGrainsM3.grass, 0)}, and ragweed ${num(current.pollenGrainsM3.ragweed, 0)}. Outside Europe those pollen series are often empty, and an empty series is not treated as a high count.`,
    `Wet-bulb globe temperature is ${fmt(summer.wbgt)} and heatstroke risk is ${summer.heatstrokeRisk}. Fitzpatrick type II sunburn time is ${summer.minutesToSunburn == null ? "not running because UV is under 1 or the sun is down" : `about ${summer.minutesToSunburn} minutes`}. Pavement estimate is ${fmt(summer.pavementTemperature)} (${summer.dogPawRisk}). ${summer.peakAcWindow ? `The peak three-hour feels-like window is ${summer.peakAcWindow.start} to ${summer.peakAcWindow.end} at ${fmt(summer.peakAcWindow.apparentTemperature)}.` : "No three-hour peak AC window was available in the next day."}`,
    `Twenty-four hour snow accumulation is ${fmt(winter.snowAccumulation24h)} and snow depth is ${fmt(winter.snowDepth)}. Black ice is ${winter.blackIce.level} with a score of ${winter.blackIce.score} out of 100. Road temperature is ${fmt(winter.blackIce.roadTemperature)} from ${winter.blackIce.roadTemperatureSource === "soil_temperature_0cm" ? "soil temperature at 0 cm" : "air temperature, because soil temperature was missing"}. Dew point is ${fmt(winter.blackIce.dewPoint)} and the spread is ${fmt(winter.blackIce.dewPointSpread)}. The hazard turns on only when the road is at or below freezing and moisture, recent rain, or a dew-point spread within 2 degrees is present.`,
    `Snow-day delay probability is ${winter.snowDayDelay.probabilityPct} percent (${winter.snowDayDelay.level}). ${winter.frostbite.label} EV range loss at the current temperature is ${commute.evRangeLossPct} percent. Cold tire-pressure drop from a 70°F placard fill is ${commute.tirePressurePsiDrop} PSI. Two-wheeler and hydroplaning risk is ${commute.hydroplaning.level} at a rain rate of ${fmt(commute.hydroplaning.rainRate)}. ${commute.laundryLabel}`,
    climate
      ? `${city.name} climate summary on file: about ${climate.annual_rain_mm} mm of rain in a typical year, peak rain in ${climate.peak_rain_months.join(", ")}, peak heat in ${climate.peak_heat_months.join(", ")}, and winter freeze months ${climate.winter_freeze_months.length ? climate.winter_freeze_months.join(", ") : "none listed"}. Today's timer sits on top of that climate, it does not replace it.`
      : `${city.name} does not yet have a stored climate normal. The live hour above is still the operational number.`,
    hourly.length
      ? `The next match and commute hours read ${hourly.map((hour) => `${hour.label} ${fmt(hour.precipitation)} at ${num(hour.probabilityPct, 0)} percent chance, ${fmt(hour.temperature)}, gust ${fmt(hour.gust)}`).join("; ")}. That sequence is the same hourly feed used for the dry-window and pipe-freeze counts.`
      : `The hourly window was empty for this response, so the minute timer and current hour are the operational numbers.`,
  ];

  return (
    <ProseArticle kicker={`${city.name} briefing`} heading={`Live local intelligence for ${city.name}`}>
      {paragraphs.map((text) => (
        <p key={text.slice(0, 48)}>{text}</p>
      ))}
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left font-semibold">Six-neighborhood micro-radar against {city.name} center</caption>
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2 pr-3">District</th>
              <th className="py-2 pr-3">Landmark</th>
              <th className="py-2 pr-3">Temperature</th>
              <th className="py-2 pr-3">Versus center</th>
              <th className="py-2 pr-3">Precipitation</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {cells.length === 0 ? (
              <tr>
                <td className="py-2" colSpan={6}>Neighborhood coordinates are not on this city record yet.</td>
              </tr>
            ) : cells.map((cell) => (
              <tr key={cell.name} className="border-b border-slate-200">
                <td className="py-2 pr-3">{cell.name}</td>
                <td className="py-2 pr-3">{cell.landmark ?? "—"}</td>
                <td className="py-2 pr-3">{fmt(cell.temperature)}</td>
                <td className="py-2 pr-3">{fmt(cell.temperatureDeltaFromCity)}</td>
                <td className="py-2 pr-3">{fmt(cell.precipitation)}</td>
                <td className="py-2">{cell.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cells.map((cell) => (
        <p key={`${cell.name}-note`}>
          {cell.name}{cell.landmark ? `, near ${cell.landmark},` : ""} is reading {fmt(cell.temperature)} and {fmt(cell.precipitation)}, {fmt(cell.temperatureDeltaFromCity)} versus the {city.name} center, with status {cell.status}. If you change trains or drive between districts, use this row rather than assuming the downtown station matches the suburb.
        </p>
      ))}
      <p>
        Stay on the {city.name} desk:{" "}
        {CITY_SILOS.map((silo, index) => (
          <span key={silo.id}>
            {index > 0 ? ", " : ""}
            <a href={`/${silo.id}/${city.slug}`}>{silo.label}</a>
          </span>
        ))}
        .
      </p>
    </ProseArticle>
  );
}
