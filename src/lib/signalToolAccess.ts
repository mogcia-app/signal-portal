export function buildSignalToolAccessUrl(userId: string): string {
  const signalToolBaseUrl =
    process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || "https://signaltool.app";

  return `${signalToolBaseUrl}/auth/callback?userId=${encodeURIComponent(userId)}`;
}

export function isValidSignalToolAccessUrl(url: string | undefined, userId: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const expectedBase = new URL(
      process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || "https://signaltool.app"
    );

    return (
      parsed.origin === expectedBase.origin &&
      parsed.pathname === "/auth/callback" &&
      parsed.searchParams.get("userId") === userId
    );
  } catch {
    return false;
  }
}
