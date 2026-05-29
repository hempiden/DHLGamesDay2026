import React, { useState } from 'react';
import { UserCheck, UserX, Trash2, ShieldAlert, Sparkles, ShieldCheck, Clock, Users, ArrowUpCircle } from 'lucide-react';
import { AppUser } from '../types';

interface UsersApprovalPanelProps {
  users: AppUser[];
  onUpdateUserStatus: (userId: string, status: 'approved' | 'rejected' | 'pending') => void;
  onUpdateUserRole: (userId: string, role: 'admin' | 'super_admin') => void;
  onDeleteUser: (userId: string) => void;
  currentUser: AppUser | null;
}

export default function UsersApprovalPanel({
  users,
  onUpdateUserStatus,
  onUpdateUserRole,
  onDeleteUser,
  currentUser,
}: UsersApprovalPanelProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Statistics calculations
  const totalCount = users.length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Upper Status & Brand Card */}
      <div className="bg-[#1a1a1a] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border-b-4 border-[#FFCC00]">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#D40511] opacity-15 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFCC00]/10 rounded-full border border-[#FFCC00]/25 text-[#FFCC00]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFCC00] fill-[#FFCC00]/10" />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Super Admin Authorization Center (តំបន់គ្រប់គ្រងសិទ្ធិ)
            </span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              គណនីអ្នកគ្រប់គ្រង & ការអនុញ្ញាត (Approved Admins)
            </h2>
            <p className="text-[11px] text-gray-400 max-w-2xl font-medium mt-1 leading-relaxed">
              As the Super Admin (<span className="text-white font-extrabold">{currentUser?.name || 'hempiden'}</span>), 
              you have full control over who is allowed to login, input scores, configure matches, and manage teams.
            </p>
          </div>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              គណនីសរុប (Total Registered)
            </span>
            <span className="text-2xl font-black text-gray-800">{totalCount}</span>
          </div>
          <div className="w-12 h-12 bg-gray-50 border rounded-xl flex items-center justify-center text-gray-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-sm relative overflow-hidden">
          {pendingCount > 0 && (
            <div className="absolute top-0 right-0 bg-[#D40511] text-white text-[8px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider animate-pulse">
              សកម្ម (Active Request)
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              រង់ចាំការអនុញ្ញាត (Pending Approval)
            </span>
            <span className={`text-2xl font-black ${pendingCount > 0 ? 'text-[#D40511]' : 'text-gray-800'}`}>
              {pendingCount}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            pendingCount > 0 ? 'bg-red-50 text-[#D40511] border-red-100' : 'bg-gray-50 text-gray-600'
          }`}>
            <Clock className={`w-6 h-6 ${pendingCount > 0 ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              សមាជិកបានយល់ព្រម (Approved Admin Users)
            </span>
            <span className="text-2xl font-black text-[#10b981]">{approvedCount}</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#10b981]">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Registrants Table card */}
      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
        
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              បញ្ជីឈ្មោះអ្នកចុះឈ្មោះប្រព័ន្ធ (ADMIN REGISTRANTS ACCOUNT ROSTER)
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight">
              Manage accounts, assign roles, approve requests, or revoke authorization instantly.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-100/50">
                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  ព័ត៌មានគណនី (Full Name & Email)
                </th>
                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  ឈ្មោះអ្នកប្រើប្រាស់ (Username)
                </th>
                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  តួនាទី (Role Position)
                </th>
                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  ស្ថានភាពសិទ្ធិ (Status)
                </th>
                <th className="py-3 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  ការគ្រប់គ្រង (AUTHORIZE ACTIONS)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id || u.username === 'hempiden';

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition duration-150">
                    
                    {/* Full Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border ${
                          u.role === 'super_admin'
                            ? 'bg-[#FFCC00]/15 text-[#D40511] border-[#FFCC00]'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5 leading-none">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[8px] font-black bg-gray-200 border text-gray-600 px-1.5 py-0.5 rounded uppercase font-mono scale-95">
                                YOU / CREATOR
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold lowercase tracking-tight mt-0.5 block">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4">
                      <code className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-150">
                        {u.username}
                      </code>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          u.role === 'super_admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role}
                        </span>

                        {!isSelf && u.role !== 'super_admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`តើអ្នកពិតជាចង់តម្លើងតួនាទីគណនី ${u.name} ទៅជា Super Admin មែនទេ?`)) {
                                onUpdateUserRole(u.id, 'super_admin');
                              }
                            }}
                            className="p-1 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-gray-400 transition"
                            title="Promote to Super Admin"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        u.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-850 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'approved' ? 'bg-emerald-500' : u.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                        }`} />
                        <span>{u.status}</span>
                      </span>
                    </td>

                    {/* Actions control */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {isSelf ? (
                          <span className="text-[10px] text-gray-300 font-medium select-none italic">
                            Protected Acc
                          </span>
                        ) : (
                          <>
                            {/* Status controls */}
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => onUpdateUserStatus(u.id, 'approved')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                title="Approve Request"
                              >
                                យល់ព្រម (Approve)
                              </button>
                            )}

                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => onUpdateUserStatus(u.id, 'rejected')}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                title="Deny / Block Login"
                              >
                                បដិសេធ (Deny)
                              </button>
                            )}

                            {/* Delete button */}
                            {confirmDeleteId === u.id ? (
                              <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-lg border border-red-100">
                                <button
                                  onClick={() => {
                                    onDeleteUser(u.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[9px] font-black text-red-600 uppercase hover:underline cursor-pointer"
                                >
                                  Yes, Del
                                </button>
                                <span className="text-gray-300 text-[9px]">/</span>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[9px] font-black text-gray-500 hover:underline cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                                title="Delete User Completely"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
