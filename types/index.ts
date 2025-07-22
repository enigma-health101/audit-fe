// types/index.ts - Complete type definitions for the enhanced system

export interface ICMPCode {
    code: string;
    description: string;
}

export interface Comorbidity {
    id: string;
    name: string;
    description: string;
    notes?: string;
    enabled: boolean;
    keywords?: string;
}

export interface ColumnMapping {
    columnName: string;
    isEnabled: boolean;
    selectedComorbidities: string[]; // Array of comorbidity IDs
    customPrompt: string;
    sampleData: string[];
}

export interface FileMetadata {
    fileName: string;
    columns: string[];
    sampleData: any[];
    detectedHeaderRow: number;
    totalRows: number;
    columnMappings: ColumnMapping[];
    fileInfo?: {
        originalShape: [number, number];
        processedShape: [number, number];
        emptyRowsRemoved: number;
    };
}

export interface ColumnAnalysis {
    [columnName: string]: {
        sample_values: string[];
        data_type: 'text' | 'numeric' | 'datetime' | 'long_text' | 'empty' | 'unknown';
        contains_medical_text: boolean;
        avg_length: number;
        unique_count: number;
        total_values: number;
    };
}

export interface ProcessingJob {
    job_id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    file_name: string;
    created_at: string;
    estimated_time?: string;
    total_columns_to_process?: number;
    processed_columns?: number;
    results?: {
        total_matches: number;
        total_rows_processed: number;
        columns_processed: number;
        matches_by_column: { [column: string]: number };
        matches_by_comorbidity: { [comorbidity: string]: number };
        output_file: string;
        processing_time: number;
    };
    error?: string;
}

export interface ComorbidityMatch {
    row_number: number;
    column_name: string;
    comorbidity_id: string;
    comorbidity_name: string;
    matched_text: string;
    excerpt: string;
    confidence: number;
    reasoning: string;
    job_id: string;
}

export interface ProcessingStats {
    id: number;
    job_id: string;
    file_name: string;
    procedure_code: string;
    processing_time: number;
    rows_processed: number;
    comorbidities_checked: number;
    matches_found: number;
    processed_at: string;
}

export interface UserConfiguration {
    id: number;
    config_name: string;
    icmp_code: string;
    comorbidities: Comorbidity[];
    column_mappings: { [fileName: string]: ColumnMapping[] };
    created_at: string;
    updated_at: string;
}

export interface DashboardStats {
    overall: {
        total_jobs: number;
        total_rows: number;
        total_matches: number;
        avg_processing_time: number;
    };
    recent_jobs: ProcessingStats[];
}

export interface LLMResponse {
    findings: Array<{
        comorbidity: string;
        confidence: number;
        excerpt: string;
        reasoning: string;
    }>;
}

export interface FileAnalysisRequest {
    file: File;
}

export interface FileAnalysisResponse {
    columns: string[];
    totalRows: number;
    detectedHeaderRow: number;
    sampleData: any[];
    sampleDataByColumn: { [column: string]: string[] };
    columnAnalysis: ColumnAnalysis;
    recommendations: Array<{
        column: string;
        reason: string;
        confidence: 'high' | 'medium' | 'low';
    }>;
    fileInfo: {
        originalShape: [number, number];
        processedShape: [number, number];
        emptyRowsRemoved: number;
    };
}

export interface ProcessingRequest {
    file: File;
    icmp_code: string;
    file_metadata: FileMetadata;
    global_settings: {
        confidence_threshold: number;
        max_processing_time: number;
    };
}

export interface ProcessingResponse {
    job_id: string;
    message: string;
    estimated_time: string;
}

// Utility types for API responses
export type ApiResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};

// Component prop types
export interface ColumnConfigurationProps {
    files: File[];
    comorbidities: Comorbidity[];
    onConfigurationChange: (config: FileMetadata[]) => void;
}

export interface ComorbidityManagementProps {
    selectedCode: string;
    comorbidities: Comorbidity[];
    onComorbidityToggle: (id: string) => void;
    onComorbidityUpdate: (comorbidities: Comorbidity[]) => void;
    stepNumber: number;
    isActive: boolean;
    isCompleted: boolean;
}

// Hook return types
export interface UseJobPollingReturn {
    [jobId: string]: ProcessingJob;
}

// Form validation types
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ColumnValidation {
    hasEnabledColumns: boolean;
    hasComorbidityMappings: boolean;
    hasCustomPrompts: boolean;
    totalMappings: number;
}

// API endpoint types
export type APIEndpoint =
    | 'icmp-codes'
    | 'comorbidities'
    | 'analyze-file-structure'
    | 'process-file-enhanced'
    | 'job-status'
    | 'download-results'
    | 'configurations'
    | 'save-configuration'
    | 'dashboard-stats';

// Database schema types (for backend)
export interface DBComorbidityMatch {
    id: number;
    job_id: string;
    file_name: string;
    row_number: number;
    column_name: string;
    comorbidity_name: string;
    matched_text: string;
    confidence_score: number;
    created_at: string;
}

export interface DBProcessingStats {
    id: number;
    job_id: string;
    config_id?: number;
    file_name: string;
    procedure_code: string;
    processing_time: number;
    rows_processed: number;
    comorbidities_checked: number;
    matches_found: number;
    processed_at: string;
}

export interface DBUserConfiguration {
    id: number;
    config_name: string;
    icmp_code: string;
    comorbidities: string; // JSON string
    column_mappings: string; // JSON string
    created_at: string;
    updated_at: string;
}

// types/index.ts
export interface ICMPCode {
    code: string;
    description: string;
}

export interface Comorbidity {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    keywords?: string;
}

export interface ColumnMapping {
    columnName: string;
    isEnabled: boolean;
    selectedComorbidities: string[];
    customPrompt: string;
    sampleData: string[];
}

export interface FileMetadata {
    fileName: string;
    columns: string[];
    sampleData: any[];
    detectedHeaderRow: number;
    totalRows: number;
    columnMappings: ColumnMapping[];
}

export interface ProcessingJob {
    job_id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    file_name: string;
    created_at: string;
    estimated_time?: string;
    total_columns_to_process?: number;
    processed_columns?: number;
    results?: {
        total_matches: number;
        total_rows_processed: number;
        columns_processed: number;
        matches_by_column: { [column: string]: number };
        matches_by_comorbidity: { [comorbidity: string]: number };
        output_file: string;
        processing_time: number;
    };
    error?: string;
}