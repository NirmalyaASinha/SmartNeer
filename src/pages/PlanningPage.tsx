import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { BrainCircuit, Send, Loader2 } from 'lucide-react';

export default function PlanningPage() {
  const token = useAuthStore(state => state.token);
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !token) return;
    
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/ai/plan', 
        { query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlan(res.data.plan);
    } catch (err) {
      console.error(err);
      setPlan("An error occurred while generating the plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg"><BrainCircuit className="h-6 w-6 text-primary" /></div>
        <h1 className="text-2xl font-bold text-gray-900">AI Expansion Planning</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <p className="text-gray-600 mb-4">
            Consult the AI assistant to plan new pipeline extensions, optimize pump schedules, or analyze maintenance patterns.
          </p>
          <form onSubmit={handleAskAI} className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. 'Plan a pipeline extension to the new school in East Ward'"
              className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-primary focus:border-primary"
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-primary text-white px-6 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
          </form>
        </div>

        {plan && (
          <div className="p-6 bg-blue-50">
            <h3 className="text-lg font-medium text-navy mb-3">AI Recommendation</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{plan}</p>
          </div>
        )}
      </div>
    </div>
  );
}
