import type { ScraperSource } from "../types";
import { autogidasSource } from "./autogidas";
import { autopliusSource } from "./autoplius";

const sources: ScraperSource[] = [autopliusSource, autogidasSource];

export function gatherSources(): ScraperSource[] {
  return sources.filter((source) => !source.disabled);
}
