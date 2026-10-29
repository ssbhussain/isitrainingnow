-- isitrainingnow master schema.
-- Public catalog tables: anon/authenticated may SELECT. service_role may write.
-- Existing SiteSpecCalc tables are not modified.

CREATE OR REPLACE FUNCTION public.iirn_cities_apply_unit_system()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.unit_system IS NULL OR btrim(NEW.unit_system) = '' THEN
    NEW.unit_system := CASE upper(btrim(COALESCE(NEW.country_code, '')))
      WHEN 'US' THEN 'imperial'
      WHEN 'GB' THEN 'uk_hybrid'
      ELSE 'metric'
    END;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.iirn_cities_apply_unit_system() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.iirn_cities_apply_unit_system() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.iirn_cities_apply_unit_system() TO service_role;

CREATE TABLE public.iirn_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  state_region TEXT,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL,
  elevation_m DOUBLE PRECISION DEFAULT 10,
  unit_system TEXT NOT NULL,
  weather_agency TEXT NOT NULL,
  neighborhoods JSONB NOT NULL DEFAULT '[]'::jsonb,
  local_airports JSONB NOT NULL DEFAULT '[]'::jsonb,
  local_transit_system TEXT,
  flood_and_traffic_hotspots TEXT[],
  housing_and_pipe_profile TEXT,
  climate_summary JSONB,
  is_raining_now BOOLEAN NOT NULL DEFAULT FALSE,
  is_snowing_now BOOLEAN NOT NULL DEFAULT FALSE,
  is_heatwave_now BOOLEAN NOT NULL DEFAULT FALSE,
  current_precip_mm DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_temp_c DOUBLE PRECISION,
  current_wind_kph DOUBLE PRECISION,
  current_pressure_hpa DOUBLE PRECISION,
  last_weather_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_hits INTEGER NOT NULL DEFAULT 1,
  is_indexed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT iirn_cities_slug_key UNIQUE (slug),
  CONSTRAINT iirn_cities_unit_system_chk CHECK (
    unit_system IN ('imperial', 'uk_hybrid', 'metric')
  ),
  CONSTRAINT iirn_cities_latitude_chk CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT iirn_cities_longitude_chk CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT iirn_cities_neighborhoods_array_chk CHECK (jsonb_typeof(neighborhoods) = 'array'),
  CONSTRAINT iirn_cities_airports_array_chk CHECK (jsonb_typeof(local_airports) = 'array')
);

COMMENT ON TABLE public.iirn_cities IS
  'Global city catalog and live weather ticker cache for isitrainingnow.';

COMMENT ON COLUMN public.iirn_cities.unit_system IS
  'imperial for US, uk_hybrid for GB, metric for CA/AU/IN and every other country. Filled by iirn_cities_apply_unit_system when omitted.';

COMMENT ON COLUMN public.iirn_cities.neighborhoods IS
  'Six local districts or suburbs: [{name, lat, lng, landmark}].';

COMMENT ON COLUMN public.iirn_cities.local_airports IS
  'Nearby airports: [{iata_code, name}].';

COMMENT ON COLUMN public.iirn_cities.climate_summary IS
  '{annual_rain_mm, peak_rain_months, winter_freeze_months, peak_heat_months}.';

CREATE TRIGGER iirn_cities_unit_system_default
  BEFORE INSERT OR UPDATE ON public.iirn_cities
  FOR EACH ROW
  EXECUTE FUNCTION public.iirn_cities_apply_unit_system();

-- UNIQUE (slug) already creates btree index iirn_cities_slug_key.
COMMENT ON INDEX public.iirn_cities_slug_key IS
  'B-tree unique index on city slug.';

CREATE INDEX iirn_cities_country_code_idx
  ON public.iirn_cities USING btree (country_code);

CREATE INDEX iirn_cities_raining_precip_idx
  ON public.iirn_cities USING btree (is_raining_now, current_precip_mm DESC);

CREATE INDEX iirn_cities_snowing_idx
  ON public.iirn_cities USING btree (is_snowing_now);

CREATE TABLE public.iirn_stadiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  sport TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL,
  roof_type TEXT DEFAULT 'Open Air',
  drainage_system TEXT DEFAULT 'Standard Grass Outfield (75 min recovery)',
  pitch_and_wind_notes TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT iirn_stadiums_slug_key UNIQUE (slug),
  CONSTRAINT iirn_stadiums_latitude_chk CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT iirn_stadiums_longitude_chk CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT iirn_stadiums_capacity_chk CHECK (capacity IS NULL OR capacity > 0)
);

COMMENT ON TABLE public.iirn_stadiums IS
  'Venue pages for high-intent queries such as stadium weather.';

COMMENT ON INDEX public.iirn_stadiums_slug_key IS
  'B-tree unique index on stadium slug.';

CREATE INDEX iirn_stadiums_country_code_idx
  ON public.iirn_stadiums USING btree (country_code);

ALTER TABLE public.iirn_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iirn_stadiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY iirn_cities_select_public
  ON public.iirn_cities
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY iirn_stadiums_select_public
  ON public.iirn_stadiums
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON TABLE public.iirn_cities FROM PUBLIC;
REVOKE ALL ON TABLE public.iirn_stadiums FROM PUBLIC;
REVOKE ALL ON TABLE public.iirn_cities FROM anon, authenticated;
REVOKE ALL ON TABLE public.iirn_stadiums FROM anon, authenticated;

GRANT SELECT ON TABLE public.iirn_cities TO anon, authenticated;
GRANT SELECT ON TABLE public.iirn_stadiums TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iirn_cities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iirn_stadiums TO service_role;
