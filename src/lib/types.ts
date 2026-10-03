export type Link = { label: string; url: string };

export type Stop = {
  id: string;
  dayIndex: number;
  start: string;
  end: string;
  category: string;
  name: string;
  address: string;
  mapsUrl: string | null;
  links: Link[];
  info: string;
  transport: string;
  travelTime: string;
  travelDetails: string;
  /** Label of the group row above this stop, e.g. "Option A — show". Null = always shown. */
  group: string | null;
};

export type Day = {
  index: number;
  /** ISO date YYYY-MM-DD */
  date: string;
  weekday: string;
  title: string;
  stops: Stop[];
  routes: Link[];
  /** Markdown that followed the table in this day section (sub-sections, notes). */
  extraMarkdown: string;
  meals: { label: string; value: string }[];
  bags: string;
};

export type Section = { title: string; markdown: string };

export type Trip = {
  title: string;
  year: number;
  basics: { label: string; value: string }[];
  days: Day[];
  /** All non-day sections except Basics, in file order. */
  sections: Section[];
};

export type ParseResult = { trip: Trip | null; errors: string[]; warnings: string[] };

export type StoredTrip = {
  id: string;
  timezone: string;
  uploadedAt: number;
  expiresAt: number;
  trip: Trip;
};
