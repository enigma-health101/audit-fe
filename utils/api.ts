// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5007';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new ApiError(response.status, `API request failed: ${response.statusText}`);
    }

    return response.json();
}

export async function uploadFile(
    endpoint: string,
    file: File,
    additionalData: Record<string, string> = {}
): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
    });

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new ApiError(response.status, `Upload failed: ${response.statusText}`);
    }

    return response.json();
}