import { useState, useEffect, useCallback } from 'react';
import { SceneConfig, getSceneConfigs, scenesConfig } from '../config/scenes';

export function useSceneManager() {
    const [scenes, setScenes] = useState<SceneConfig[]>(scenesConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchScenes = useCallback(async (forceRefresh = false) => {
        try {
            setIsLoading(true);
            const fetchedScenes = await getSceneConfigs(forceRefresh);
            
            // Only update if we actually got scenes back
            if (fetchedScenes && fetchedScenes.length > 0) {
                setScenes(fetchedScenes);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching scenes:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch scenes'));
            // Fall back to scenesConfig on error
            setScenes(scenesConfig);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScenes();
    }, [fetchScenes]);

    const refreshScenes = useCallback(async () => {
        await fetchScenes(true);
    }, [fetchScenes]);

    return {
        scenes,
        isLoading,
        error,
        refreshScenes
    };
}