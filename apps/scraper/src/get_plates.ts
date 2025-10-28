import { env } from "../env";
import { logger } from "./helpers";

export async function getPlates(images: string[]): Promise<string[]> {
  try {
    const queryString = `?image_path=${images.join("&image_path=")}`;
    if (images.length === 0) return [];

    const response = await fetch(`${env.PLATES_API_URL}${queryString}`);
    if (!response.ok) {
      logger.error({ response }, "Error getting plates");
      return [];
    }
    const data = (await response.json()) as { plates: string[] };
    return data.plates;
  } catch (error) {
    logger.error({ error }, "Error getting plates");
    return [];
  }
}
