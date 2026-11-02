import { redirect } from 'next/navigation';

/**
 * The 180-Day Founder feature has been officially retired from Founder Cockpit.
 * All historical database records in founder_checkins are preserved.
 * Any inbound navigation or bookmark gracefully redirects to the Today dashboard.
 */
export default function RetiredFounder180Page() {
  redirect('/');
}
