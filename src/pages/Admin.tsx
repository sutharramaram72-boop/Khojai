import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShoppingBag, 
  Flag, 
  TrendingUp, 
  ShieldAlert, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  MoreVertical,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  UserX,
  Package,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { UserProfile, Post, Product } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

type Tab = 'overview' | 'users' | 'content' | 'shop' | 'reports';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().role === 'admin') {
      setIsAdmin(true);
      fetchData();
    } else {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, reportsData] = await Promise.all([
        adminService.getPlatformStats(),
        adminService.getAllUsers(),
        adminService.getReportedContent()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setLoading(false);
  };

  const handleResolveReport = async (reportId: string, action: any) => {
    await adminService.resolveReport(reportId, action);
    fetchData();
  };

  const handleUpdateUserRole = async (userId: string, role: any) => {
    await adminService.updateUserStatus(userId, { role });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-white p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have administrative privileges to access this panel.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-6 px-6 py-2 bg-primary rounded-full font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
              <p className="text-xs text-muted-foreground">KhojAI Platform Management</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-primary" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'content', label: 'Moderation', icon: Flag },
            { id: 'shop', label: 'Shop', icon: ShoppingBag },
            { id: 'reports', label: 'Reports', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {[
                { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Total Posts', value: stats?.totalPosts, icon: Package, color: 'text-purple-400' },
                { label: 'Total Products', value: stats?.totalProducts, icon: ShoppingBag, color: 'text-orange-400' },
                { label: 'Total Orders', value: stats?.totalOrders, icon: ArrowRight, color: 'text-green-400' },
                { label: 'Revenue', value: `₹${stats?.totalRevenue}`, icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Reports', value: stats?.pendingReports, icon: Flag, color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">User Management</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Trust Score</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                            <div>
                              <div className="font-medium">{user.displayName}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${user.trustScore}%` }}
                              />
                            </div>
                            <span className="text-xs">{user.trustScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateUserRole(user.uid, user.role === 'admin' ? 'user' : 'admin')}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-primary"
                              title="Toggle Admin"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateUserRole(user.uid, 'blocked')}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-destructive"
                              title="Block User"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold">Pending Reports</h2>
              {reports.length === 0 ? (
                <div className="bg-white/5 p-12 rounded-2xl border border-white/10 text-center">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">All clear! No pending reports.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 bg-destructive/20 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase text-[10px] bg-white/10 px-2 py-0.5 rounded text-muted-foreground">
                              {report.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Reported by {report.reporterId.slice(0, 8)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium">{report.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">Target ID: {report.targetId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleResolveReport(report.id, 'dismiss')}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Dismiss
                        </button>
                        <button 
                          onClick={() => handleResolveReport(report.id, 'delete_content')}
                          className="px-3 py-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Delete Content
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
