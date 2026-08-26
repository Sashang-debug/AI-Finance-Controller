import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertTriangle, CheckCircle, Search, Bot, BrainCircuit, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function RunDetails() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  // Exception Modal State
  const [selectedException, setSelectedException] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`/api/reconciliation/runs/${id}/results`);
      setResults(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  const handleExplain = async (exceptionId: string) => {
    setAiLoading(true);
    try {
      await axios.post(`/api/exceptions/${exceptionId}/explain`);
      await fetchResults();
      
      // Update local state for modal
      const updatedRes = await axios.get(`/api/reconciliation/runs/${id}/results`);
      setResults(updatedRes.data);
      setSelectedException(updatedRes.data.find((r: any) => r.id === exceptionId));
      
    } catch (err: any) {
      console.error(err);
      alert('Failed to get AI explanation: ' + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleResolve = async (exceptionId: string) => {
    setReviewLoading(true);
    try {
      await axios.post(`/api/exceptions/${exceptionId}/review`, { status: 'RESOLVED' });
      await fetchResults();
      setSelectedException(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to resolve exception: ' + (err.response?.data?.error || err.message));
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredResults = results.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'EXACT_MATCH') return r.classification === 'EXACT_MATCH';
    return r.classification !== 'EXACT_MATCH';
  });

  if (loading) return <div className="text-slate-500">Loading run details...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/runs" className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Run Details</h2>
          <p className="text-slate-500 text-sm mt-1 font-mono">{id}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", filter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}
            >
              All Records
            </button>
            <button
              onClick={() => setFilter('EXCEPTIONS')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", filter === 'EXCEPTIONS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}
            >
              Exceptions
            </button>
            <button
              onClick={() => setFilter('EXACT_MATCH')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", filter === 'EXACT_MATCH' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}
            >
              Exact Matches
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search IDs..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Classification</th>
                <th className="px-6 py-4 font-medium text-right">Ledger Amt</th>
                <th className="px-6 py-4 font-medium text-right">Settlement Amt</th>
                <th className="px-6 py-4 font-medium text-right">Bank Amt</th>
                <th className="px-6 py-4 font-medium">Review Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredResults.map((result) => {
                const isExact = result.classification === 'EXACT_MATCH';
                const isResolved = result.reviewStatus === 'RESOLVED';

                return (
                  <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">
                      {result.ledgerRecord?.transactionId || result.settlementRecord?.paymentId || result.bankRecord?.bankTransactionId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        isExact ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {!isExact && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {result.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">
                      {result.ledgerRecord?.amount != null ? `₹${result.ledgerRecord.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">
                      {result.settlementRecord?.settlementAmount != null ? `₹${result.settlementRecord.settlementAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">
                      {result.bankRecord?.amount != null ? `₹${result.bankRecord.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isResolved ? (
                        <span className="flex items-center text-emerald-600 font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" /> Resolved
                        </span>
                      ) : (
                        <span className="text-slate-400">Unreviewed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {!isExact && (
                        <button 
                          onClick={() => setSelectedException(result)}
                          className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Investigate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Exception Review
              </h3>
              <button 
                onClick={() => setSelectedException(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Classification</p>
                  <p className="text-base font-medium text-red-600">{selectedException.classification}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Matching Rule Applied</p>
                  <p className="text-base font-medium text-slate-700 font-mono text-sm">{selectedException.ruleUsed || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Calculated Difference</p>
                  <p className="text-base font-bold text-slate-900 font-mono">
                    {selectedException.amountDifference != null ? `₹${selectedException.amountDifference.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-blue-900 flex items-center">
                    <BrainCircuit className="w-5 h-5 mr-2 text-blue-600" />
                    AI Diagnosis
                  </h4>
                  {!selectedException.aiExplanation && (
                    <button 
                      onClick={() => handleExplain(selectedException.id)}
                      disabled={aiLoading}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {aiLoading ? <Activity className="w-3 h-3 mr-1 animate-spin" /> : <Bot className="w-3 h-3 mr-1" />}
                      Generate Explanation
                    </button>
                  )}
                </div>
                
                {selectedException.aiExplanation ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-sm text-blue-900 leading-relaxed">{selectedException.aiExplanation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Recommendation</p>
                      <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 p-3 rounded-lg leading-relaxed">{selectedException.aiRecommendation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700 opacity-80 italic">No AI explanation has been generated for this exception yet. Click the button above to request one.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedException(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleResolve(selectedException.id)}
                disabled={reviewLoading || selectedException.reviewStatus === 'RESOLVED'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center"
              >
                {reviewLoading && <Activity className="w-4 h-4 mr-2 animate-spin" />}
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
