export const assert = (ok: boolean, message = "assertion failed") => {
  if (!ok) throw new Error(message);
};

export const assertEq = (a: unknown, b: unknown, message?: string) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(message || `${sa} !== ${sb}`);
};
