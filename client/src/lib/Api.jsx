const BASE = "/api";

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getPackages: () => req("GET", "/packages"),
  getStats: () => req("GET", "/stats"),
  addPackage: (pkg, deps) =>
    req("POST", "/packages/add", { package: pkg, deps }),
  installPackage: (pkg) => req("POST", "/packages/install", { package: pkg }),
  deletePackage: (name, version) =>
    req("DELETE", `/packages/${encodeURIComponent(name)}/${version}`),
};
