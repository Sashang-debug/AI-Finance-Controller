import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { Activity, AlertCircle } from 'lucide-react';

export default function ReconciliationRuns() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await axios.get('/api/reconciliation/runs');
        setRuns(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  if (loading) return <div className="text-slate-500">Loading runs history...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reconciliation History</h2>
        <p className="text-slate-500 text-sm mt-1">View all past reconciliation runs and their match rates.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {runs.length === 0 && !error ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No Runs Found</h3>
          <p className="text-slate-500 mt-2">There are no reconciliation runs in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">Run ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Total Processed</th>
                  <th className="px-6 py-4 font-medium">Match Rate</th>
                  <th className="px-6 py-4 font-medium">Exceptions</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {runs.map((run) => {
                  let metrics = null;
                  try {
                    metrics = typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics;
                  } catch(e) {}
                  
                  return (
                    <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600 truncate max-w-[120px]">
                        {run.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {format(new Date(run.createdAt), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {metrics?.totalProcessed ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {metrics?.matchRate ? `${metrics.matchRate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {metrics?.exceptions ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Link 
                          to={`/runs/${run.id}`} 
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
