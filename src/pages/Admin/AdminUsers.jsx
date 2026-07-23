import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Search, ChevronDown, ChevronUp, Mail, Phone, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Fallback for timestamps if they exist
        createdAtStr: doc.data().createdAt?.toDate 
          ? doc.data().createdAt.toDate().toLocaleDateString('en-GB') 
          : 'Unknown'
      }));
      
      // Sort in memory by creation date if available (or just keep as is)
      usersData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load registered users');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user.firstName || '').toLowerCase().includes(search) ||
      (user.lastName || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search) ||
      (user.phone || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[70vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider flex items-center gap-3">
            <Users className="text-lg-red" size={28} />
            Registered Users
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Manage and view all customer accounts</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:border-lg-red outline-none transition-colors"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-400">
          <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-lg-red"></i>
          <p className="font-bold uppercase tracking-widest text-sm">Loading Users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-black text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 text-sm">We couldn't find any matching users.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-300">
              {/* Header Row (Always Visible) */}
              <div 
                onClick={() => toggleExpand(user.id)}
                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer bg-white"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-50 text-lg-red flex items-center justify-center font-black text-lg flex-shrink-0">
                    {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 truncate">
                      {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unnamed User'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-gray-500 truncate">{user.email}</span>
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-gray-900">{user.createdAtStr}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined</div>
                  </div>
                  <div className={`p-2 rounded-full transition-colors ${expandedUser === user.id ? 'bg-red-50 text-lg-red' : 'bg-gray-100 text-gray-400'}`}>
                    {expandedUser === user.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              {expandedUser === user.id && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Mail size={12} /> Contact Info
                      </h4>
                      <p className="text-sm font-bold text-gray-800 break-all">{user.email}</p>
                      <div className="mt-1">
                        {user.isEmailVerified ? (
                          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Unverified</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Phone size={12} /> Phone Number
                      </h4>
                      <p className="text-sm font-bold text-gray-800">{user.phone || 'Not provided'}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Shield size={12} /> Account Role
                      </h4>
                      <p className="text-sm font-bold text-gray-800 capitalize">{user.role || 'user'}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Calendar size={12} /> Registered On
                      </h4>
                      <p className="text-sm font-bold text-gray-800">{user.createdAtStr}</p>
                    </div>
                    
                  </div>

                  {user.address && (
                    <div className="mt-6 pt-6 border-t border-gray-200/60">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Saved Address</h4>
                      <p className="text-sm font-medium text-gray-700">{user.address}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200/60 flex justify-end">
                     <p className="text-xs text-gray-400 font-medium font-mono">User ID: {user.id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
