// hooks/useApi.ts
import { useState, useEffect } from 'react';
import { apiRequest, ApiError } from '../utils/api';

export function useApi<T>(url: string, dependencies: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await apiRequest<T>(url);
                if (!isCancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err instanceof ApiError ? err.message : 'An unexpected error occurred');
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, dependencies);

    return { data, loading, error, refetch: () => setLoading(true) };
}