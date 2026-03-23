import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function usePackages() {
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [pkgData, statsData] = await Promise.all([
        api.getPackages(),
        api.getStats(),
      ]);
      setPackages(pkgData.packages);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPackage = useCallback(
    async (pkg, deps) => {
      const data = await api.addPackage(pkg, deps);
      await refresh();
      return data;
    },
    [refresh],
  );

  const installPackage = useCallback(async (pkg) => {
    return api.installPackage(pkg);
  }, []);

  const deletePackage = useCallback(
    async (name, version) => {
      await api.deletePackage(name, version);
      await refresh();
    },
    [refresh],
  );

  return {
    packages,
    stats,
    loading,
    error,
    refresh,
    addPackage,
    installPackage,
    deletePackage,
  };
}
