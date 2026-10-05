import React, { useState } from 'react';
import { useStore } from '../../store';
import { Ticket, TicketStatus } from '../../types';
import {
  Wrench,
  Plus,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const MaintenanceKanban: React.FC = () => {
  const { tickets, updateTicketStatus, addNewTicket, setSelectedNodeId } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNodeId, setNewNodeId] = useState('NODE-14');
  const [newPriority, setNewPriority] = useState<Ticket['priority']>('High');
  const [newTechnician, setNewTechnician] = useState('Suresh Patil (GP Fitter)');

  const columns: { id: TicketStatus; label: string; countColor: string }[] = [
    { id: 'Open', label: 'Triage / Open', countColor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
    { id: 'In Progress', label: 'Under Repair', countColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    { id: 'Fixed', label: 'Verified & Fixed', countColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  ];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    addNewTicket({
      title: newTitle,
      nodeId: newNodeId,
      priority: newPriority,
      assignedTechnician: newTechnician,
      targetResolutionDate: 'Today, within 4 hours',
      costEstimateInr: 650,
      notes: ['Direct field maintenance entry from VWSC Planner'],
    });
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-indigo-600" />
            Gram Panchayat Maintenance &amp; Fitter Work Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Field technician assignments, SLA timelines, acoustic leak verification, and repair cost ledger.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${col.countColor}`}>
                  {colTickets.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3">
                {colTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No tickets in this stage
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const isEmergency = ticket.priority === 'Emergency';
                    const isHigh = ticket.priority === 'High';

                    return (
                      <div
                        key={ticket.id}
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5 transition hover:shadow-md"
                      >
                        {/* Top: Ticket ID & Priority Badge */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[11px] text-slate-500">
                            {ticket.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isEmergency
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : isHigh
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {ticket.title}
                        </h4>

                        {/* Node & Segment Reference */}
                        <div className="flex items-center space-x-2 text-[11px]">
                          <button
                            onClick={() => setSelectedNodeId(ticket.nodeId)}
                            className="font-mono font-bold text-brand-blue dark:text-cyan-400 hover:underline"
                          >
                            {ticket.nodeId}
                          </button>
                          {ticket.segmentId && (
                            <span className="font-mono text-slate-400">
                              ({ticket.segmentId})
                            </span>
                          )}
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">Est: ₹{ticket.costEstimateInr}</span>
                        </div>

                        {/* Photo placeholder if available */}
                        {ticket.photoPlaceholderUrl && (
                          <div className="relative rounded-lg overflow-hidden h-24 border border-slate-200 dark:border-slate-700">
                            <img
                              src={ticket.photoPlaceholderUrl}
                              alt="Excavation & Pipe Repair Inspection"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono flex items-center gap-1">
                              <ImageIcon className="w-2.5 h-2.5" /> Field Photo
                            </span>
                          </div>
                        )}

                        {/* Technician details */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {ticket.assignedTechnician.split(' ')[0]} {ticket.assignedTechnician.split(' ')[1]}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <Clock className="w-3 h-3" />
                            {ticket.targetResolutionDate}
                          </span>
                        </div>

                        {/* Move Card Action Buttons */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          {col.id !== 'Open' ? (
                            <button
                              onClick={() => {
                                const prev = col.id === 'Fixed' ? 'In Progress' : 'Open';
                                updateTicketStatus(ticket.id, prev);
                              }}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5"
                            >
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                          ) : (
                            <span />
                          )}

                          {col.id !== 'Fixed' && (
                            <button
                              onClick={() => {
                                const next = col.id === 'Open' ? 'In Progress' : 'Fixed';
                                updateTicketStatus(ticket.id, next);
                              }}
                              className="text-[10px] font-bold text-brand-blue dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              Advance <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to add new Ticket */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Create New Pipeline Repair Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Issue Description / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect loose flanged joint at Anganwadi"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Sensor Node
                  </label>
                  <select
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {Array.from({ length: 18 }).map((_, i) => {
                      const id = `NODE-${String(i + 1).padStart(2, '0')}`;
                      return (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Ticket['priority'])}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  value={newTechnician}
                  onChange={(e) => setNewTechnician(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
