import { useState, useCallback, useRef, useEffect } from 'react';

export function useHistory(initialState) {
    const [past, setPast] = useState([]);
    const [present, setPresent] = useState(initialState);
    const [future, setFuture] = useState([]);

    const presentRef = useRef(present);
    useEffect(() => {
        presentRef.current = present;
    }, [present]);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const undo = useCallback(() => {
        if (!canUndo) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        setPast(newPast);
        setPresent(previous);
        setFuture([presentRef.current, ...future]);
    }, [canUndo, past, future]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        const next = future[0];
        const newFuture = future.slice(1);
        
        setPast([...past, presentRef.current]);
        setPresent(next);
        setFuture(newFuture);
    }, [canRedo, past, future]);

    const commit = useCallback((newState) => {
        setPresent(prevPresent => {
            const stateToCommit = typeof newState === 'function' ? newState(prevPresent) : newState;
            setPast(prevPast => {
                const updatedPast = [...prevPast, prevPresent];
                if (updatedPast.length > 50) {
                    return updatedPast.slice(updatedPast.length - 50);
                }
                return updatedPast;
            });
            setFuture([]); // clearing future on new action
            return stateToCommit;
        });
    }, []);

    const updatePresent = useCallback((newState) => {
        setPresent(newState);
    }, []);

    const reset = useCallback((newState) => {
        setPast([]);
        setPresent(newState);
        setFuture([]);
    }, []);

    return {
        state: present,
        commit,
        updatePresent,
        undo,
        redo,
        canUndo,
        canRedo,
        reset
    };
}
