import { env } from "../env";
import { logError } from "./error";
import { logger } from "./helpers";

const log = logger.child({ module: "getPlates" });

export async function getPlates(images: string[]): Promise<string[]> {
  try {
    const queryString = `/recognize_plate?image_path=${images.join("&image_path=")}`;
    if (images.length === 0) return [];

    const response = await fetch(`${env.PLATES_API_URL}${queryString}`);
    if (!response.ok) {
      log.error({ response }, "Error getting plates");
      return [];
    }
    const data = (await response.json()) as { plates: string[] };
    return data.plates;
  } catch (error) {
    await logError("Error getting plates", error);
    return [];
  }
}
