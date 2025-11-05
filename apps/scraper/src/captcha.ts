import { env } from "../env";
import { logError } from "./error";
import { delay } from "./helpers";
import { taskCreated, taskRetrieved } from "./validators";

export async function createCaptchaTask({
  type,
  websiteURL,
  websiteKey,
  minScore,
  isEnterprise = false,
  apiDomain = "google.com",
  action,
  retry = 0,
}: {
  type: "RecaptchaV3TaskProxyless" | "RecaptchaV2TaskProxyless";
  websiteURL: string;
  websiteKey: string;
  minScore: 0.3 | 0.7 | 0.9;
  isEnterprise?: boolean;
  apiDomain?: "google.com" | "recaptcha.net";
  action?: string | undefined;
  retry?: number;
}) {
  try {
    const response = await fetch("https://api.2captcha.com/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientKey: env.CAPTCHA_KEY,
        task: {
          type,
          websiteURL,
          websiteKey,
          minScore,
          isEnterprise,
          apiDomain,
          action,
        },
      }),
    });
    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse = await response.json();
    const data = await taskCreated.parseAsync(jsonResponse);

    if (data.errorId !== 0)
      throw new Error(`Failed to create task: ${JSON.stringify(jsonResponse)}`);

    return data;
  } catch (error) {
    await logError("Failed to create 2captcha task", error, {
      sendToDiscord: true,
    });
    if (retry < 3)
      return createCaptchaTask({
        type,
        websiteURL,
        websiteKey,
        minScore,
        isEnterprise,
        apiDomain,
        action,
        retry: retry + 1,
      });
  }
  return undefined;
}

export async function retrieveCaptchaTask(
  id: number
): Promise<string | undefined> {
  await delay(5000);

  const waitForSeconds = 60;
  for (let i = 0; i < waitForSeconds; i += 2) {
    try {
      const retrieveTask = await fetch(
        "https://api.2captcha.com/getTaskResult",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientKey: env.CAPTCHA_KEY,
            taskId: id,
          }),
        }
      );
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonResponse = await retrieveTask.json();
      const data = await taskRetrieved.parseAsync(jsonResponse);

      if (data.status === "ready") return data.solution.token;

      await delay(2000);
      continue;
    } catch (error) {
      await logError("Failed retrieving captcha.", error, {
        sendToDiscord: true,
      });
      return undefined;
    }
  }
  await logError("Retrieving captcha for took too long.", "", {
    sendToDiscord: true,
  });
  return undefined;
}

export async function solveCaptcha({
  type,
  websiteURL,
  websiteKey,
  minScore,
  isEnterprise = false,
  apiDomain = "google.com",
  action,
}: {
  type: "RecaptchaV3TaskProxyless" | "RecaptchaV2TaskProxyless";
  websiteURL: string;
  websiteKey: string;
  minScore: 0.3 | 0.7 | 0.9;
  isEnterprise?: boolean;
  apiDomain?: "google.com" | "recaptcha.net";
  action?: string | undefined;
}) {
  const taskCreated = await createCaptchaTask({
    type,
    websiteURL,
    websiteKey,
    minScore,
    isEnterprise,
    apiDomain,
    action,
  });
  if (!taskCreated?.taskId) return undefined;
  const token = await retrieveCaptchaTask(taskCreated.taskId);
  return token;
}
