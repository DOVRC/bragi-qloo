/** Split discovery warnings into user-facing vs technical diagnostics. */

const TECHNICAL =
  /elapsed \d+ms|wall time|deadline|Resolve budget|ranked \d+\/\d+|Insights call timeout|Native Insights|untyped|hit\(s\) but none matched|skipped remaining|Tags search|Search \(untyped|Qloo-native path|continuing with partial|Forbidden|RATE|ms \(deadline/i;

const USER_ACTIONABLE =
  /sample-data|No Qloo|API key|unauthorized|forbidden|rate.?limit|unavailable|could not|failed to|missing|empty|exclude|Not my style|prioritized feedback|More like|Surprise path|Live mode never|demonstration/i;

export function partitionDiscoveryWarnings(warnings: string[]): {
  userFacing: string[];
  technical: string[];
} {
  const userFacing: string[] = [];
  const technical: string[] = [];

  for (const w of warnings) {
    const text = w.trim();
    if (!text) continue;
    if (TECHNICAL.test(text) && !USER_ACTIONABLE.test(text)) {
      technical.push(text);
      continue;
    }
    if (USER_ACTIONABLE.test(text) || /error|fail|unable|partial evidence/i.test(text)) {
      // Keep correctness-impacting messages visible; still copy heavy timing to technical
      if (TECHNICAL.test(text) && /elapsed|wall time|deadline|ranked \d/i.test(text)) {
        technical.push(text);
      } else {
        userFacing.push(text);
      }
      continue;
    }
    if (TECHNICAL.test(text)) {
      technical.push(text);
    } else {
      userFacing.push(text);
    }
  }

  return { userFacing, technical };
}
