import React from 'react';
import { useRouter } from 'next/router';
import ClinicalAuditDashboard from './ClinicalAuditDashboard';

const AuditDashboardPage = () => {
    const router = useRouter();
    const { job_id } = router.query;

    return (
        // The component is now rendered directly without a layout wrapper
        <ClinicalAuditDashboard jobId={job_id as string | undefined} />
    );
};

export default AuditDashboardPage;