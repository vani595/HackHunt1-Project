import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function useSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSources();
      setSources(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
      console.error('Error fetching sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const createSource = async (source) => {
    try {
      const newSource = await apiClient.createSource(source);
      setSources(prev => [...prev, newSource]);
      return newSource;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create source'
      );
    }
  };

  const updateSource = async (provider, updates) => {
    try {
      await apiClient.updateSource(provider, updates);
      setSources(prev =>
        prev.map(source =>
          source.provider === provider
            ? { ...source, ...updates }
            : source
        )
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update source'
      );
    }
  };

  const deleteSource = async (id) => {
    try {
      await apiClient.deleteSource(id);
      setSources(prev => prev.filter(source => source.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete source'
      );
    }
  };

  const fetchFromSource = async (provider) => {
    try {
      const result = await apiClient.fetchFromSource(provider);

      // Update the source with new fetch data
      setSources(prev =>
        prev.map(source =>
          source.provider === provider
            ? {
                ...source,
                lastFetched: new Date().toISOString(),
                hackathonsCount: result.count
              }
            : source
        )
      );

      console.log(result);
      return result;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to fetch from source'
      );
    }
  };

  return {
    sources,
    loading,
    error,
    createSource,
    updateSource,
    deleteSource,
    fetchFromSource,
    refetch: fetchSources
  };
}
