// pages/api/[...slug].ts - Complete fixed version with proper frontend-backend integration

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// Backend configuration from environment variables
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5007';
const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;

console.log(`[API] Backend configured: ${BACKEND_API_URL}`);

// Configure API to handle different content types
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to manually parse JSON body when needed
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Helper function to get parsed body with fallback methods
async function getParsedBody(req: NextApiRequest): Promise<any> {
  console.log('=== BODY PARSING DEBUG ===');
  console.log('req.body:', req.body);
  console.log('req.body type:', typeof req.body);
  console.log('Content-Type:', req.headers['content-type']);

  // Method 1: Check if Next.js already parsed the body
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log('Method 1: Using pre-parsed body');
    return req.body;
  }

  // Method 2: If body is a string, try to parse it
  if (req.body && typeof req.body === 'string') {
    try {
      console.log('Method 2: Parsing string body');
      return JSON.parse(req.body);
    } catch (e) {
      console.log('Method 2 failed:', e);
    }
  }

  // Method 3: Manually read the raw body
  try {
    console.log('Method 3: Reading raw body');
    const rawBody = await getRawBody(req);
    console.log('Raw body:', rawBody);

    if (rawBody.trim()) {
      return JSON.parse(rawBody);
    }
  } catch (e) {
    console.log('Method 3 failed:', e);
  }

  console.log('All body parsing methods failed');
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug || '';

  console.log(`=== API ROUTE HANDLER ===`);
  console.log(`Path: ${path}, Method: ${req.method}`);

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (path) {
      case 'icmp-codes':
        return handleIcmpCodes(req, res);

      case 'configurations':
        return handleConfigurations(req, res);

      case 'save-configuration':
        return handleSaveConfiguration(req, res);

      case 'analyze-columns':
        return handleAnalyzeColumnsWithFormData(req, res);

      case 'analyze-file-structure':
        return handleAnalyzeFileStructure(req, res);

      case 'process-file-enhanced':
        return handleProcessFileEnhanced(req, res);

      case 'process-file':
        return handleProcessFileWithFormData(req, res);

      case 'dashboard-stats':
        return handleDashboardStats(req, res);

      case 'consolidate-files':
        return handleConsolidateFiles(req, res);

      default:
        // Handle dynamic routes
        if (path.startsWith('comorbidities/')) {
          const pathParts = path.split('/');
          const code = pathParts[1];

          if (pathParts.length === 2) {
            return handleComorbidities(req, res, code);
          } else if (pathParts.length === 3) {
            const comorbidityId = pathParts[2];
            return handleIndividualComorbidity(req, res, code, comorbidityId);
          }
        }

        if (path.startsWith('upload/')) {
          return handleGenericFileUpload(req, res, path);
        }

        if (path.startsWith('job-results/')) {
          const jobId = path.split('/')[1];
          return handleJobResults(req, res, jobId);
        }

        if (path.startsWith('jobs/')) {
          return handleDeleteJobRequest(req, res, path);
        }

        if (path.startsWith('job-status/')) {
          const jobId = path.split('/')[1];
          return handleJobStatus(req, res, jobId);
        }

        if (path.startsWith('download-results/')) {
          const jobId = path.split('/')[1];
          return handleDownloadResults(req, res, jobId);
        }

        return res.status(404).json({ error: 'API route not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CRITICAL FIX 1: Enhanced handleJobResults with proper transformation
async function handleJobResults(req: NextApiRequest, res: NextApiResponse, jobId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!jobId) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    // FIXED: Extract format parameter correctly
    const format = req.url?.includes('format=enhanced') ? 'enhanced' : 'legacy';
    console.log(`--- [API] Job results request for ${jobId} with format: ${format} ---`);

    const backendUrl = `${BACKEND_API_URL}/job-results/${jobId}?format=${format}`;
    console.log(`--- [API] Calling backend: ${backendUrl} ---`);

    const response = await fetch(backendUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Job results not found in backend' });
      }
      const errorText = await response.text();
      console.error(`Backend error: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`--- [API] Backend response received for job ${jobId} ---`);

    // FIXED: Always transform data to match frontend expectations
    const transformedData = transformJobResultsForFrontend(data, format);

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching job results:', error);
    res.status(500).json({ error: 'Failed to fetch job results' });
  }
}

// CRITICAL FIX 2: Completely rewritten data transformation
function transformJobResultsForFrontend(backendData: any, format: string) {
  console.log(`--- [API] Transforming job results for format: ${format} ---`);
  console.log(`--- [API] Backend data keys: ${Object.keys(backendData || {})} ---`);

  try {
    // Base structure that frontend expects
    const transformedData: any = {
      stats: {
        rows_processed: backendData.stats?.rows_processed || 0,
        matches_found: backendData.stats?.matches_found || 0,
        processing_time: backendData.stats?.processing_time || 0,
        successful_surgeries: backendData.stats?.successful_surgeries || 0,
        failed_surgeries: backendData.stats?.failed_surgeries || 0,
        output_file_path: backendData.stats?.output_file_path || null
      },
      matches: backendData.matches || [],
      summary: {
        matches_by_comorbidity: backendData.summary?.matches_by_comorbidity || {},
        matches_by_column: backendData.summary?.matches_by_column || {}
      }
    };

    // FIXED: Handle patient summaries with proper mortality and surgery parsing
    if (backendData.patient_summaries) {
      transformedData.patient_summaries = backendData.patient_summaries.map((patient: any) => {
        // Parse JSON fields safely
        const failureCauses = safeParseJSONArray(patient.failure_causes);
        const primaryConcerns = safeParseJSONArray(patient.primary_concerns);
        const mortalityCauses = safeParseJSONArray(patient.mortality_causes);

        // FIXED: Don't default unknown to success - preserve actual values
        let surgeryOutcome = patient.surgery_outcome;
        if (!surgeryOutcome || surgeryOutcome === '') {
          surgeryOutcome = 'unknown';  // Keep as unknown, don't default to success
        }

        // FIXED: Handle mortality status properly
        let mortalityStatus = patient.mortality_status;
        if (!mortalityStatus || mortalityStatus === '') {
          mortalityStatus = 'alive';  // Default to alive only if truly missing
        }

        return {
          patient_id: patient.patient_id,
          total_comorbidities: patient.total_comorbidities || 0,
          highest_confidence: patient.highest_confidence || 0,
          comorbidity_summary: patient.comorbidity_summary || '',
          surgery_outcome: surgeryOutcome,
          failure_causes: failureCauses,
          primary_concerns: primaryConcerns,
          comprehensive_summary: patient.comprehensive_summary || '',
          columns_analyzed: patient.columns_analyzed || 0,
          // FIXED: Add mortality fields to patient summaries
          mortality_status: mortalityStatus,
          mortality_confidence: patient.mortality_confidence || 0,
          mortality_causes: mortalityCauses,
          time_of_death: patient.time_of_death || null
        };
      });
    }

    // FIXED: Generate comprehensive patient_analytics with mortality data
    if (format === 'enhanced' || backendData.patient_summaries) {
      transformedData.patient_analytics = generateEnhancedPatientAnalytics(
        transformedData.patient_summaries || [],
        transformedData.stats,
        transformedData.matches || [],
        backendData.patient_analytics
      );
    }

    console.log(`--- [API] Transformation complete. Patients: ${transformedData.patient_summaries?.length || 0} ---`);
    return transformedData;

  } catch (error) {
    console.error('--- [API] Error transforming job results:', error);
    return backendData; // Return original data if transformation fails
  }
}

// CRITICAL FIX 3: Better JSON parsing with proper fallbacks
function safeParseJSONArray(jsonString: any, fallback: any[] = []): any[] {
  if (Array.isArray(jsonString)) {
    return jsonString;
  }

  if (typeof jsonString === 'string' && jsonString.trim()) {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.warn('Failed to parse JSON array:', jsonString);
      // Try to extract meaningful data from malformed JSON
      if (jsonString.includes(',')) {
        return jsonString.split(',').map(s => s.trim().replace(/["\[\]]/g, '')).filter(s => s);
      }
      return [jsonString.replace(/["\[\]]/g, '')];
    }
  }

  return fallback;
}

function safeParseJSON(jsonString: any, fallback: any = null) {
  if (typeof jsonString === 'string') {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('Failed to parse JSON:', jsonString);
      return fallback;
    }
  }
  return jsonString || fallback;
}

function calculateSuccessRate(successful: number, failed: number): number {
  const total = successful + failed;
  return total > 0 ? (successful / total) * 100 : 0;
}

// CRITICAL FIX 4: Enhanced failure causes extraction
function extractFailureCauses(patientSummaries: any[]): Record<string, number> {
  const failureCauses: Record<string, number> = {};

  patientSummaries.forEach(patient => {
    if (patient.surgery_outcome === 'failure' && patient.failure_causes) {
      const causes = Array.isArray(patient.failure_causes) ? patient.failure_causes : [patient.failure_causes];
      causes.forEach((cause: string) => {
        if (cause && typeof cause === 'string' && cause.trim()) {
          const cleanCause = cause.trim();
          if (cleanCause !== 'null' && cleanCause !== '' && cleanCause !== 'undefined') {
            failureCauses[cleanCause] = (failureCauses[cleanCause] || 0) + 1;
          }
        }
      });
    }
  });

  return failureCauses;
}

// CRITICAL FIX 5: Enhanced analytics generation with proper mortality and surgery breakdown
function generateEnhancedPatientAnalytics(patientSummaries: any[], stats: any, matches: any[] = [], existingAnalytics: any = {}) {
  console.log(`--- [API] Generating enhanced analytics for ${patientSummaries.length} patients ---`);

  if (!patientSummaries || patientSummaries.length === 0) {
    return {
      total_patients: 0,
      avg_comorbidities_per_patient: 0,
      most_common_comorbidities: {},
      most_effective_columns: {},
      surgery_outcomes: { successful: 0, failed: 0, unknown: 0, success_rate: 0 },
      mortality_analytics: {
        deceased_patients: 0,
        alive_patients: 0,
        mortality_rate: 0,
        mortality_causes: {},
        failed_surgery_deaths: 0,
        success_surgery_deaths: 0,
        death_rate_in_failed: 0,
        death_rate_in_successful: 0,
        high_risk_comorbidities: {},
        risk_distribution: { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 }
      },
      failure_causes: {}
    };
  }

  // FIXED: Proper surgery outcome counting with unknown category
  const totalPatients = patientSummaries.length;
  const surgeryOutcomes = {
    successful: patientSummaries.filter(p => p.surgery_outcome === 'success').length,
    failed: patientSummaries.filter(p => p.surgery_outcome === 'failure').length,
    unknown: patientSummaries.filter(p => p.surgery_outcome === 'unknown' || !p.surgery_outcome).length,
    success_rate: totalPatients > 0 ? (patientSummaries.filter(p => p.surgery_outcome === 'success').length / totalPatients) * 100 : 0
  };

  // FIXED: Proper mortality analytics
  const mortalityAnalytics = {
    deceased_patients: patientSummaries.filter(p => p.mortality_status === 'deceased').length,
    alive_patients: patientSummaries.filter(p => p.mortality_status === 'alive' || !p.mortality_status).length,
    mortality_rate: 0,
    mortality_causes: {},
    // Enhanced mortality analytics
    failed_surgery_deaths: 0,
    success_surgery_deaths: 0,
    death_rate_in_failed: 0,
    death_rate_in_successful: 0,
    high_risk_comorbidities: {},
    risk_distribution: { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 }
  };

  mortalityAnalytics.mortality_rate = totalPatients > 0 ? (mortalityAnalytics.deceased_patients / totalPatients) * 100 : 0;

  // FIXED: Extract mortality causes from deceased patients
  const allMortalityCauses: string[] = [];
  let failedSurgeryDeaths = 0;
  let successSurgeryDeaths = 0;

  patientSummaries.forEach(patient => {
    if (patient.mortality_status === 'deceased') {
      // Count deaths by surgery outcome
      if (patient.surgery_outcome === 'failure') {
        failedSurgeryDeaths++;
      } else if (patient.surgery_outcome === 'success') {
        successSurgeryDeaths++;
      }

      // Extract mortality causes
      if (patient.mortality_causes && Array.isArray(patient.mortality_causes)) {
        patient.mortality_causes.forEach((cause: string) => {
          if (cause && cause.trim() && cause !== 'null') {
            allMortalityCauses.push(cause.trim());
          }
        });
      }
    }
  });

  // Build mortality causes frequency
  const mortalityCauseFreq: Record<string, number> = {};
  allMortalityCauses.forEach(cause => {
    mortalityCauseFreq[cause] = (mortalityCauseFreq[cause] || 0) + 1;
  });

  mortalityAnalytics.mortality_causes = mortalityCauseFreq;
  mortalityAnalytics.failed_surgery_deaths = failedSurgeryDeaths;
  mortalityAnalytics.success_surgery_deaths = successSurgeryDeaths;
  mortalityAnalytics.death_rate_in_failed = surgeryOutcomes.failed > 0 ? (failedSurgeryDeaths / surgeryOutcomes.failed) * 100 : 0;
  mortalityAnalytics.death_rate_in_successful = surgeryOutcomes.successful > 0 ? (successSurgeryDeaths / surgeryOutcomes.successful) * 100 : 0;

  // FIXED: Enhanced comorbidity extraction with multiple sources
  const comorbidityCounts: Record<string, number> = {};

  // Extract from primary concerns (multiple comorbidities per patient)
  patientSummaries.forEach(patient => {
    if (patient.primary_concerns && Array.isArray(patient.primary_concerns)) {
      patient.primary_concerns.forEach((concern: any) => {
        let comorbidityName = '';
        if (typeof concern === 'string') {
          comorbidityName = concern;
        } else if (concern && typeof concern === 'object' && concern.comorbidity) {
          comorbidityName = concern.comorbidity;
        }

        if (comorbidityName && comorbidityName.trim()) {
          const cleanName = comorbidityName.trim();
          comorbidityCounts[cleanName] = (comorbidityCounts[cleanName] || 0) + 1;
        }
      });
    }
  });

  // If no comorbidities from primary concerns, extract from matches
  if (Object.keys(comorbidityCounts).length === 0 && matches.length > 0) {
    matches.forEach(match => {
      const comorbidityName = match.comorbidity_name;
      if (comorbidityName && comorbidityName.trim()) {
        comorbidityCounts[comorbidityName] = (comorbidityCounts[comorbidityName] || 0) + 1;
      }
    });
  }

  // Calculate high-risk comorbidities (those with higher mortality rates)
  const highRiskComorbidities: Record<string, number> = {};
  Object.keys(comorbidityCounts).forEach(comorbidity => {
    const patientsWithComorbidity = patientSummaries.filter(p =>
      p.primary_concerns && p.primary_concerns.includes(comorbidity)
    );
    const deceasedWithComorbidity = patientsWithComorbidity.filter(p => p.mortality_status === 'deceased');

    if (patientsWithComorbidity.length > 0) {
      const mortalityRate = (deceasedWithComorbidity.length / patientsWithComorbidity.length) * 100;
      if (mortalityRate > 20) { // Consider >20% mortality rate as high risk
        highRiskComorbidities[comorbidity] = mortalityRate;
      }
    }
  });

  mortalityAnalytics.high_risk_comorbidities = highRiskComorbidities;

  // Calculate risk distribution
  patientSummaries.forEach(patient => {
    const comorbidityCount = patient.total_comorbidities || 0;
    const isDeceased = patient.mortality_status === 'deceased';
    const isFailed = patient.surgery_outcome === 'failure';

    if (isDeceased && isFailed) {
      mortalityAnalytics.risk_distribution['Critical']++;
    } else if (isDeceased || (isFailed && comorbidityCount >= 3)) {
      mortalityAnalytics.risk_distribution['High']++;
    } else if (isFailed || comorbidityCount >= 2) {
      mortalityAnalytics.risk_distribution['Medium']++;
    } else {
      mortalityAnalytics.risk_distribution['Low']++;
    }
  });

  const totalComorbidities = patientSummaries.reduce((sum, p) => sum + (p.total_comorbidities || 0), 0);
  const avgComorbidities = totalComorbidities / patientSummaries.length;

  // Extract column effectiveness from matches
  const columnCounts: Record<string, number> = {};
  matches.forEach(match => {
    const columnName = match.column_name;
    if (columnName && columnName.trim()) {
      columnCounts[columnName] = (columnCounts[columnName] || 0) + 1;
    }
  });

  const analytics = {
    total_patients: patientSummaries.length,
    avg_comorbidities_per_patient: avgComorbidities,
    most_common_comorbidities: comorbidityCounts,
    most_effective_columns: columnCounts,
    surgery_outcomes: surgeryOutcomes,
    mortality_analytics: mortalityAnalytics,
    failure_causes: extractFailureCauses(patientSummaries)
  };

  console.log(`--- [API] Enhanced analytics generated: ${analytics.total_patients} patients, ${Object.keys(analytics.most_common_comorbidities).length} unique comorbidities, Surgery: ${analytics.surgery_outcomes.successful}S/${analytics.surgery_outcomes.failed}F/${analytics.surgery_outcomes.unknown}U, Mortality: ${analytics.mortality_analytics.deceased_patients}/${analytics.mortality_analytics.alive_patients} ---`);

  return analytics;
}

// CRITICAL FIX 6: Enhanced dashboard stats transformation
async function handleDashboardStats(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`--- [API] Fetching dashboard stats from backend ---`);
    const response = await fetch(`${BACKEND_API_URL}/dashboard-stats`);

    if (!response.ok) {
      console.error(`Backend dashboard stats error: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`--- [API] Backend dashboard data keys: ${Object.keys(data || {})} ---`);

    // FIXED: Transform dashboard stats with proper structure
    const transformedData = transformDashboardStatsForFrontend(data);

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

function transformDashboardStatsForFrontend(backendData: any) {
  try {
    console.log(`--- [API] Transforming dashboard stats ---`);

    // Ensure all expected fields exist with defaults
    const transformedData = {
      overall: {
        total_jobs: backendData.overall?.total_jobs || 0,
        total_rows: backendData.overall?.total_rows || 0,
        total_matches: backendData.overall?.total_matches || 0,
        avg_processing_time: backendData.overall?.avg_processing_time || 0
      },
      recent_jobs: (backendData.recent_jobs || []).map((job: any) => ({
        job_id: job.job_id,
        procedure_code: job.procedure_code || 'Unknown',
        processing_time: job.processing_time || 0,
        rows_processed: job.rows_processed || 0,
        comorbidities_checked: job.comorbidities_checked || 0,
        matches_found: job.matches_found || 0,
        successful_surgeries: job.successful_surgeries || 0,
        failed_surgeries: job.failed_surgeries || 0,
        processed_at: job.processed_at,
        file_name: job.file_name || 'Unknown'
      }))
    };

    // FIXED: Enhanced stats with proper filtering and structure
    if (backendData.enhanced) {
      const enhanced: any = {
        patient_analytics: backendData.enhanced.patient_analytics || {},
        surgery_analytics: backendData.enhanced.surgery_analytics || {
          total_successful_surgeries: 0,
          total_failed_surgeries: 0,
          overall_success_rate: 0,
          avg_success_rate: 0
        },
        top_comorbidities: {},
        top_failure_causes: {},
        column_effectiveness: backendData.enhanced.column_effectiveness || []
      };

      // FIXED: Filter and clean comorbidities data
      if (backendData.enhanced.top_comorbidities) {
        Object.entries(backendData.enhanced.top_comorbidities).forEach(([key, value]: [string, any]) => {
          if (key && key.trim() && value > 0) {
            enhanced.top_comorbidities[key] = value;
          }
        });
      }

      // FIXED: Filter and clean failure causes data
      if (backendData.enhanced.top_failure_causes) {
        Object.entries(backendData.enhanced.top_failure_causes).forEach(([key, value]: [string, any]) => {
          if (key && key.trim() && value > 0 && key !== 'null' && key !== 'undefined') {
            enhanced.top_failure_causes[key] = value;
          }
        });
      }

      (transformedData as any).enhanced = enhanced;
    }

    console.log(`--- [API] Dashboard transformation complete. Jobs: ${transformedData.recent_jobs.length}, Comorbidities: ${Object.keys((transformedData as any).enhanced?.top_comorbidities || {}).length}, Failure causes: ${Object.keys((transformedData as any).enhanced?.top_failure_causes || {}).length} ---`);

    return transformedData;
  } catch (error) {
    console.error('Error transforming dashboard stats:', error);
    return backendData; // Return original data if transformation fails
  }
}

// File upload and other handlers
async function handleGenericFileUpload(req: NextApiRequest, res: NextApiResponse, path: string) {
  console.log(`--- [API] Handling generic file upload for: ${path} ---`);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    const fileContent = fs.readFileSync(file.filepath);
    const blob = new Blob([fileContent]);
    formData.append('file', blob, file.originalFilename || 'upload');

    const backendUrl = `${BACKEND_API_URL}/${path}`;
    console.log(`--- [API] Forwarding upload to: ${backendUrl} ---`);

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData
    });

    const responseBody = await response.text();
    const responseJson = JSON.parse(responseBody);

    if (!response.ok) {
      console.error(`--- [API] Backend upload error for ${path}:`, responseBody);
      return res.status(response.status).json(responseJson);
    }
    fs.unlinkSync(file.filepath);
    res.status(200).json(responseJson);
  } catch (error) {
    console.error(`--- ❌ CRITICAL ERROR in handleGenericFileUpload for ${path} ❌ ---`, error);
    res.status(500).json({ error: `Failed to upload file for ${path}` });
  }
}

async function handleDeleteJobRequest(req: NextApiRequest, res: NextApiResponse, path: string) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobId = path.split('/')[1];
  if (!jobId) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    console.log(`--- [API] Forwarding DELETE request for job: ${jobId} ---`);
    const backendUrl = `${BACKEND_API_URL}/jobs/${jobId}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error(`--- [API] Backend delete error for ${jobId}:`, responseBody);
      return res.status(response.status).json(responseBody);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    console.error(`--- ❌ CRITICAL ERROR in handleDeleteJobRequest for ${jobId} ❌ ---`, error);
    res.status(500).json({ error: `Failed to delete job ${jobId}` });
  }
}

async function handleAnalyzeFileStructure(req: NextApiRequest, res: NextApiResponse) {
  console.log('--- [API] Handler for analyze-file-structure started ---');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024,
      keepExtensions: true,
    });

    console.log('--- [API] 1. Parsing form data from browser... ---');
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('--- [API] 2. Formidable parsing complete. ---');

    if (!file) {
      console.error('--- [API] No file found after parsing. ---');
      return res.status(400).json({ error: 'No file provided' });
    }
    console.log(`--- [API] 3. File found: ${file.originalFilename}, Temp path: ${file.filepath} ---`);

    const formData = new FormData();
    const fileContent = fs.readFileSync(file.filepath);
    const blob = new Blob([fileContent]);
    formData.append('file', blob, file.originalFilename || 'upload.xlsx');
    console.log(`--- [API] 4. Created new FormData for backend. ---`);

    console.log('--- [API] 5. Sending FETCH request to Python backend... ---');
    const response = await fetch(`${BACKEND_API_URL}/analyze-file-structure`, {
      method: 'POST',
      body: formData
    });
    console.log('--- [API] 6. FETCH request completed. Backend response status:', response.status, '---');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('--- [API] Backend responded with an error:', errorText);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('--- [API] 7. Successfully received and parsed JSON from backend. ---');

    fs.unlinkSync(file.filepath);
    res.status(200).json(data);

  } catch (error) {
    console.error('--- ❌ CRITICAL ERROR in analyze-file-structure ❌ ---');
    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Cause:', (error as any).cause);
      console.error('Error Stack:', error.stack);
    } else {
      console.error('Caught a non-Error object:', error);
    }
    res.status(500).json({ error: 'Failed to analyze file structure' });
  }
}

async function handleProcessFileEnhanced(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(file.filepath)]);
    formData.append('file', blob, file.originalFilename || 'upload.xlsx');

    const icmpCode = Array.isArray(fields.icmp_code) ? fields.icmp_code[0] : fields.icmp_code;
    const fileMetadata = Array.isArray(fields.file_metadata) ? fields.file_metadata[0] : fields.file_metadata;
    const globalSettings = Array.isArray(fields.global_settings) ? fields.global_settings[0] : fields.global_settings;

    if (icmpCode) formData.append('icmp_code', icmpCode);
    if (fileMetadata) formData.append('file_metadata', fileMetadata);
    if (globalSettings) formData.append('global_settings', globalSettings);

    const response = await fetch(`${BACKEND_API_URL}/process-file-enhanced`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    fs.unlinkSync(file.filepath);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error processing file enhanced:', error);
    res.status(500).json({ error: 'Failed to process file with enhanced configuration' });
  }
}

// Comorbidities management handlers
async function handleComorbidities(req: NextApiRequest, res: NextApiResponse, code: string) {
  if (!code) {
    return res.status(400).json({ error: 'Invalid ICMP code' });
  }

  try {
    console.log(`=== HANDLING COMORBIDITIES ===`);
    console.log(`Code: ${code}, Method: ${req.method}`);

    if (req.method === 'GET') {
      const response = await fetch(`${BACKEND_API_URL}/comorbidities/${encodeURIComponent(code)}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend GET error: ${errorText}`);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (req.method === 'POST') {
      console.log('=== POST REQUEST ===');

      const body = await getParsedBody(req);
      console.log('Final parsed body:', body);

      if (!body || typeof body !== 'object') {
        console.error('No valid body found');
        return res.status(400).json({ error: 'No valid request body provided' });
      }

      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        console.error('Name field invalid:', body.name);
        return res.status(400).json({ error: 'Comorbidity name is required' });
      }

      const cleanedData = {
        name: String(body.name).trim(),
        description: String(body.description || '').trim(),
        keywords: String(body.keywords || '').trim()
      };

      console.log('Sending to Flask backend:', cleanedData);

      const response = await fetch(`${BACKEND_API_URL}/comorbidities/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      console.log(`Flask response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Flask error response: ${errorText}`);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      console.log('Flask success response:', data);

      return res.status(201).json(data);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('=== COMORBIDITIES ERROR ===');
    console.error('Error:', error);

    res.status(500).json({
      error: 'Failed to handle comorbidities request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleIndividualComorbidity(req: NextApiRequest, res: NextApiResponse, code: string, comorbidityId: string) {
  if (!code || !comorbidityId) {
    return res.status(400).json({ error: 'Invalid ICMP code or comorbidity ID' });
  }

  try {
    console.log(`=== INDIVIDUAL COMORBIDITY ===`);
    console.log(`Code: ${code}, ID: ${comorbidityId}, Method: ${req.method}`);

    if (req.method === 'PUT') {
      const body = await getParsedBody(req);
      console.log('Update body:', body);

      if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      const cleanedData = Object.fromEntries(
        Object.entries(body).filter(([key, value]) =>
          value !== undefined && value !== null && value !== ''
        )
      );

      console.log('Sending update to Flask:', cleanedData);

      const response = await fetch(`${BACKEND_API_URL}/comorbidities/${encodeURIComponent(code)}/${encodeURIComponent(comorbidityId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Flask update error: ${errorText}`);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (req.method === 'DELETE') {
      console.log('Deleting comorbidity');

      const response = await fetch(`${BACKEND_API_URL}/comorbidities/${encodeURIComponent(code)}/${encodeURIComponent(comorbidityId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Flask delete error: ${errorText}`);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling individual comorbidity:', error);
    res.status(500).json({ error: 'Failed to handle comorbidity request' });
  }
}

// File analysis handlers
async function handleAnalyzeColumnsWithFormData(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(file.filepath)]);
    formData.append('file', blob, file.originalFilename || 'upload.xlsx');

    const response = await fetch(`${BACKEND_API_URL}/analyze-columns`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    fs.unlinkSync(file.filepath);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error analyzing columns:', error);
    res.status(500).json({ error: 'Failed to analyze columns' });
  }
}

async function handleProcessFileWithFormData(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(file.filepath)]);
    formData.append('file', blob, file.originalFilename || 'upload.xlsx');

    const icmpCode = Array.isArray(fields.icmp_code) ? fields.icmp_code[0] : fields.icmp_code;
    const comorbidities = Array.isArray(fields.comorbidities) ? fields.comorbidities[0] : fields.comorbidities;
    const columnMappings = Array.isArray(fields.column_mappings) ? fields.column_mappings[0] : fields.column_mappings;

    if (icmpCode) formData.append('icmp_code', icmpCode);
    if (comorbidities) formData.append('comorbidities', comorbidities);
    if (columnMappings) formData.append('column_mappings', columnMappings);

    const response = await fetch(`${BACKEND_API_URL}/process-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    fs.unlinkSync(file.filepath);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
}

// Basic handlers
async function handleIcmpCodes(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/icmp-codes`);
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching ICMP codes:', error);
    res.status(500).json({ error: 'Failed to fetch ICMP codes' });
  }
}

async function handleConfigurations(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/configurations`);
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
}

async function handleSaveConfiguration(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/save-configuration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
}

// Job management handlers
async function handleJobStatus(req: NextApiRequest, res: NextApiResponse, jobId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!jobId) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/job-status/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Job not found' });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
}

async function handleDownloadResults(req: NextApiRequest, res: NextApiResponse, jobId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!jobId) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/download-results/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Results not found' });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=results-${jobId}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error downloading results:', error);
    res.status(500).json({ error: 'Failed to download results' });
  }
}

async function handleConsolidateFiles(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/consolidate-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=consolidated-results.xlsx');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error consolidating files:', error);
    res.status(500).json({ error: 'Failed to consolidate files' });
  }
}