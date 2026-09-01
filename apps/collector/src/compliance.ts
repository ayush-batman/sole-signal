import robotsParser from "robots-parser";

const userAgent =
  "SoleSignalBot/0.1 (+https://github.com/solesignal/solesignal; compliance contact required before production)";

export async function assertRobotsAllowed(url: string): Promise<void> {
  const target = new URL(url);
  const robotsUrl = new URL("/robots.txt", target).toString();
  const response = await fetch(robotsUrl, {
    headers: { "user-agent": userAgent },
  });
  if (!response.ok)
    throw new Error(
      `Robots check failed with HTTP ${response.status}; collection stopped.`,
    );
  const robots = robotsParser(robotsUrl, await response.text());
  if (!robots.isAllowed(url, userAgent))
    throw new Error(
      `robots.txt disallows ${target.pathname}; collection stopped.`,
    );
}

export function requestHeaders(): Record<string, string> {
  return {
    "user-agent": userAgent,
    accept: "application/json,text/html;q=0.9",
  };
}
