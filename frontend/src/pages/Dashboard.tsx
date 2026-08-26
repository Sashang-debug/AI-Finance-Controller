import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Activity, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunReconciliation = async () => {
    setRunning(true);
    setError('');
    try {
      await axios.post('/api/reconciliation/run');
      await fetchRuns();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;

  const latestRun = runs[0];
  let metrics = null;
  let chartData: { name: string; value: number; color: string }[] = [];

  if (latestRun && latestRun.metrics) {
    try {
      metrics = typeof latestRun.metrics === 'string' ? JSON.parse(latestRun.metrics) : latestRun.metrics;
      chartData = [
        { name: 'Exact Matches', value: metrics.exactMatches, color: '#10b981' }, // green-500
        { name: 'Exceptions', value: metrics.exceptions, color: '#ef4444' }, // red-500
      ];
    } catch (e) {
      console.error("Failed to parse metrics", e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Overview of your financial reconciliations</p>
        </div>
        <button
          onClick={handleRunReconciliation}
          disabled={running}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center disabled:opacity-50"
        >
          {running ? (
            <Activity className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {running ? 'Running...' : 'Run Reconciliation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {runs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No Reconciliations Yet</h3>
          <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
            Get started by importing your ledger, settlements, and bank statements, then run your first reconciliation.
          </p>
          <Link to="/import" className="text-blue-600 font-medium hover:underline">
            Go to Import Data &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Metrics Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
              <span className="text-sm font-medium text-slate-500 mb-1">Total Processed</span>
              <span className="text-3xl font-bold text-slate-900">{metrics?.totalProcessed || 0}</span>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-emerald-600 mb-1">Match Rate</span>
              <span className="text-3xl font-bold text-slate-900">{metrics?.matchRate || '0.00'}%</span>
              <span className="text-xs text-slate-500 mt-2">{metrics?.exactMatches || 0} exact matches</span>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-600 mb-1">Exceptions</span>
              <span className="text-3xl font-bold text-slate-900">{metrics?.exceptions || 0}</span>
              <Link to={`/runs/${latestRun.id}`} className="text-xs text-blue-600 mt-2 hover:underline">
                View details &rarr;
              </Link>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-80">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Latest Run Distribution</h3>
            {chartData.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value} records`, 'Count']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                No metrics available
              </div>
            )}
          </div>
          
          {/* Recent Runs Table */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Recent Runs</h3>
              <Link to="/runs" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Run ID</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Match Rate</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.slice(0, 5).map((run) => {
                    let runMetrics = null;
                    try {
                      runMetrics = typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics;
                    } catch(e) {}
                    
                    return (
                      <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 truncate max-w-[120px]">
                          {run.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {format(new Date(run.createdAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          {runMetrics?.matchRate ? `${runMetrics.matchRate}%` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Link to={`/runs/${run.id}`} className="text-blue-600 font-medium hover:text-blue-800">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
