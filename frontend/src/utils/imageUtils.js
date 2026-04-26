/**
 * Utility to format product image URLs and handle placeholders
 */

const BACKEND_URL = 'http://localhost:5000'; // Default dev backend
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'; // High-quality tech placeholder

export const formatImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;

    // If it's already a full external URL (not pointing to our Localhost), return as is
    if (url.startsWith('http') && !url.includes('localhost:5000') && !url.includes('127.0.0.1:5000')) {
        return url;
    }

    // Fix legacy absolute localhost paths in database or from backend
    // This allows mobile devices on same network to find the backend on the PC
    if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
        const path = url.split(':5000')[1]; // Get everything after port
        const currentHost = window.location.hostname;
        return `http://${currentHost}:5000${path}`;
    }

    // If it's a relative path starting with /static (new behavior)
    if (url.startsWith('/')) {
        const currentHost = window.location.hostname;
        return `http://${currentHost}:5000${url}`;
    }

    return url;
};

export const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
    e.target.onerror = null; // Prevent infinite loop if placeholder also fails
};

export const DEFAULT_PLACEHOLDER = PLACEHOLDER_IMAGE;
