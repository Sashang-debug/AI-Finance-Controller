import { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, FileType } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface SourceCardProps {
  title: string;
  description: string;
  endpoint: string;
}

function SourceCard({ title, description, endpoint }: SourceCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`/api/import/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      setMessage(res.data.message || 'Import successful');
      setFile(null);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <FileType className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">CSV File</label>
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setStatus('idle');
              setMessage('');
            }}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-100 file:text-slate-700
              hover:file:bg-slate-200 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          {status === 'uploading' ? (
             <UploadCloud className="w-4 h-4 mr-2 animate-bounce" />
          ) : (
            <UploadCloud className="w-4 h-4 mr-2" />
          )}
          Upload & Import
        </button>

        {status === 'success' && (
          <div className="flex items-center text-emerald-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {message}
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center text-red-600 text-sm font-medium max-w-[200px] truncate" title={message}>
            <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImportData() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Import Data</h2>
        <p className="text-slate-500 text-sm mt-1">Upload CSV files from different sources to prepare for reconciliation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SourceCard
          title="Internal Ledger"
          description="Your internal system of record transactions."
          endpoint="ledger"
        />
        <SourceCard
          title="Payment Gateway Settlements"
          description="Settlement reports provided by the PG (e.g. Razorpay)."
          endpoint="settlements"
        />
        <SourceCard
          title="Bank Statements"
          description="Actual credits and debits from your bank account."
          endpoint="bank"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8 flex items-start">
        <AlertCircle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
        <div className="text-amber-800 text-sm">
          <p className="font-semibold mb-1">Important Data Note</p>
          <p>
            The system expects the CSV files to match the expected schema format exactly. 
            Ensure your files contain the required headers before uploading.
          </p>
        </div>
      </div>
    </div>
  );
}
