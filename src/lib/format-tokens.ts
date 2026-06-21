export function formatTokenCost(count: number): string {
  return `${count} token${count === 1 ? "" : "s"}`;
}

export function formatGenerateLabel(cost: number, verb = "Generate"): string {
  return `${verb} · ${formatTokenCost(cost)}`;
}
