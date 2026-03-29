const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const hostname = window.location.hostname;

const frontendPort = window.location.port || "3000";

const API_BASE_URL = isLocalhost ? "http://localhost:8080" : `http://${hostname}:8080`;

const FRONTEND_BASE_URL = isLocalhost ? "http://localhost:3000" : `http://${hostname}:${frontendPort}`;

const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    IMAGES_API: `${API_BASE_URL}/src/api/images/`,
    USERS_API: `${API_BASE_URL}/src/api/users/`,
    STICKERS_URL: `${API_BASE_URL}/stickers/`,
    UPLOADS_URL: `${API_BASE_URL}/uploads/`,
    FRONTEND_URL: FRONTEND_BASE_URL
};