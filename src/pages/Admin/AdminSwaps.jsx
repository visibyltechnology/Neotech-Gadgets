import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { RefreshCw, Search, Calendar, ChevronRight, XCircle, Package, Download, ExternalLink, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSwaps() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  
  const [selectedSwap, setSelectedSwap] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'swapRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setSwaps(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'swapRequests', id), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Request status updated to ${newStatus}`);
      if (selectedSwap && selectedSwap.id === id) {
        setSelectedSwap({ ...selectedSwap, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const filteredSwaps = swaps.filter(s => {
    const matchesSearch = 
      (s.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || '').includes(searchTerm);
      
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full text-xs font-black uppercase tracking-wider">Pending</span>;
      case 'reviewed': return <span className="px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-xs font-black uppercase tracking-wider">Reviewed</span>;
      case 'accepted': return <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-xs font-black uppercase tracking-wider">Accepted</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-xs font-black uppercase tracking-wider">Rejected</span>;
      default: return <span className="px-3 py-1 bg-gray-500/10 text-gray-600 border border-gray-500/20 rounded-full text-xs font-black uppercase tracking-wider">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin text-brandRed" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <RefreshCw className="text-brandRed" size={28} />
              Swap & Sell Requests
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage and evaluate customer trade-in requests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ref ID, customer, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-brandRed focus:border-brandRed transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status 
                    ? 'bg-brandRed text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Swaps Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase tracking-wider">
                <th className="p-4">Reference ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Intent</th>
                <th className="p-4 hidden md:table-cell">Devices</th>
                <th className="p-4 hidden lg:table-cell">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSwaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold">No requests found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSwaps.map(swap => (
                  <tr key={swap.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-brandRed bg-red-50 px-2 py-1 rounded text-sm">
                        {swap.referenceId}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{swap.fullName}</p>
                      <p className="text-xs text-gray-500">{swap.phone}</p>
                    </td>
                    <td className="p-4">
                      {swap.intent === 'sell' ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase">Sell</span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">Swap</span>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="font-bold text-gray-800">{swap.devices?.length || 1} Device(s)</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-gray-600 font-medium">
                      {swap.createdAt?.toDate ? swap.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(swap.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedSwap(swap)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-brandRed bg-white border border-gray-200 hover:border-brandRed px-3 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        View <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Swap Details */}
      {selectedSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight flex items-center gap-3">
                  {selectedSwap.intent === 'sell' ? 'Sell' : 'Swap'} Request <span className="font-mono text-brandRed text-lg bg-red-50 px-2 py-1 rounded-md">{selectedSwap.referenceId}</span>
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Submitted on {selectedSwap.createdAt?.toDate ? selectedSwap.createdAt.toDate().toLocaleString() : 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedSwap(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Customer Info */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 lg:col-span-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brandRed"></div> Customer Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Full Name</p>
                    <p className="font-bold text-gray-900">{selectedSwap.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                    <a href={`tel:${selectedSwap.phone}`} className="font-bold text-blue-600 hover:underline">{selectedSwap.phone}</a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    {selectedSwap.email ? <a href={`mailto:${selectedSwap.email}`} className="font-bold text-blue-600 hover:underline">{selectedSwap.email}</a> : <span className="text-sm text-gray-400">Not provided</span>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="font-bold text-gray-900">{selectedSwap.location || <span className="text-gray-400 font-normal">Not provided</span>}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brandRed"></div> Identity Documents
                  </h4>
                  {selectedSwap.idCardUrl ? (
                    <a href={selectedSwap.idCardUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors mb-3">
                      <ExternalLink size={16} /> View Government ID
                    </a>
                  ) : (
                    <p className="text-xs text-red-500 font-bold mb-3">No ID Card uploaded!</p>
                  )}
                  {selectedSwap.receiptUrl ? (
                    <a href={selectedSwap.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                      <ExternalLink size={16} /> View Product Receipt
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No receipt provided.</p>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brandRed"></div> Request Status
                  </h4>
                  <div className="mb-4">
                    {getStatusBadge(selectedSwap.status)}
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleStatusChange(selectedSwap.id, 'pending')} className={`p-2 text-xs font-bold rounded-lg border transition-all ${selectedSwap.status === 'pending' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Pending</button>
                      <button onClick={() => handleStatusChange(selectedSwap.id, 'reviewed')} className={`p-2 text-xs font-bold rounded-lg border transition-all ${selectedSwap.status === 'reviewed' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Reviewed</button>
                      <button onClick={() => handleStatusChange(selectedSwap.id, 'accepted')} className={`p-2 text-xs font-bold rounded-lg border transition-all ${selectedSwap.status === 'accepted' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Accepted</button>
                      <button onClick={() => handleStatusChange(selectedSwap.id, 'rejected')} className={`p-2 text-xs font-bold rounded-lg border transition-all ${selectedSwap.status === 'rejected' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Rejected</button>
                    </div>
                  </div>
                </div>

                {selectedSwap.intent === 'swap' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Target Upgrade
                    </h4>
                    <p className="font-bold text-gray-900 text-sm">{selectedSwap.targetProductName}</p>
                  </div>
                )}
              </div>

              {/* Devices Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brandRed mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brandRed"></div> Devices Submitted ({selectedSwap.devices?.length || 0})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedSwap.devices || []).map((device, idx) => (
                    <div key={idx} className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                      <h5 className="font-black text-gray-900 text-lg mb-1">{device.brand} {device.name}</h5>
                      <p className="text-xs text-brandRed font-bold uppercase tracking-wider mb-4">Device {idx + 1} • {device.deviceType || 'Phone'}</p>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                        <div>
                          <p className="text-[10px] uppercase text-gray-500 font-bold">Condition</p>
                          <p className="font-bold text-gray-900 capitalize">{device.condition.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-500 font-bold">Neatness</p>
                          <p className="font-bold text-gray-900">{device.neatness}/10</p>
                        </div>

                        {device.deviceType === 'phone' && (
                          <>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Storage</p>
                              <p className="font-bold text-gray-900">{device.phoneStorage || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Battery</p>
                              <p className="font-bold text-gray-900">{device.batteryHealth ? `${device.batteryHealth}%` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Carrier</p>
                              <p className="font-bold text-gray-900 capitalize">{device.carrier || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Sim Type</p>
                              <p className="font-bold text-gray-900 capitalize">{device.simType || 'N/A'}</p>
                            </div>
                          </>
                        )}

                        {device.deviceType === 'laptop' && (
                          <>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Processor</p>
                              <p className="font-bold text-gray-900">{device.processor || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">RAM</p>
                              <p className="font-bold text-gray-900">{device.ram || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Storage</p>
                              <p className="font-bold text-gray-900">{device.phoneStorage || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-gray-500 font-bold">Cycle Count</p>
                              <p className="font-bold text-gray-900">{device.batteryHealth || 'N/A'}</p>
                            </div>
                          </>
                        )}
                        
                        {/* Issues */}
                        <div className="col-span-2 pt-2 border-t border-red-200 mt-1">
                          <p className="text-[10px] uppercase text-red-600 font-black tracking-widest mb-2">Hardware Status</p>
                          <div className="flex flex-wrap gap-2">
                            {device.repairedBefore === 'yes' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Repaired</span>}
                            {device.changedScreen === 'yes' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Screen Changed</span>}
                            {device.changedBattery === 'yes' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Battery Changed</span>}
                            {device.crackOnBody === 'yes' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Cracked</span>}
                            {device.faceIdWorking === 'no' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">No FaceID</span>}
                            {device.snapchatBanned === 'yes' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Snapchat Banned</span>}
                            {device.repairedBefore === 'no' && device.crackOnBody === 'no' && device.changedScreen === 'no' && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Clean Hardware</span>
                            )}
                          </div>
                        </div>

                        {device.notes && (
                          <div className="col-span-2 mt-2">
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Customer Notes</p>
                            <p className="text-sm text-gray-700 italic">{device.notes}</p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm font-bold flex gap-3 mt-4">
                  <DollarSign className="text-yellow-600 flex-shrink-0" />
                  <p>Quotation Pending: Please review the detailed specifications and hardware conditions above and contact the customer at {selectedSwap.phone} to negotiate the final {selectedSwap.intent === 'sell' ? 'purchase price' : 'swap difference'}.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
