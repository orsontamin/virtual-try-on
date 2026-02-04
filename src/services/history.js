
const HISTORY_KEY = 'vto_history';

export const saveToHistory = (imageData) => {
    try {
        const history = getHistory();
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            image: imageData
        };
        // Keep last 5 images to avoid localStorage limits (Base64 is heavy)
        let updatedHistory = [newEntry, ...history].slice(0, 5);
        
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (quotaError) {
            try {
                // If still full, keep only the newest one
                console.warn("Storage near limit, keeping only the latest result.");
                localStorage.setItem(HISTORY_KEY, JSON.stringify([newEntry]));
            } catch (finalError) {
                // Absolute fallback: clear everything to keep app running
                console.error("Storage completely full. Clearing history.");
                localStorage.removeItem(HISTORY_KEY);
            }
        }
        return true;
    } catch (e) {
        console.error("Failed to save to history", e);
        return false;
    }
};

export const getHistory = () => {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
