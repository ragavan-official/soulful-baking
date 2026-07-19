import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, UserCheck, ShieldAlert, LogOut, ArrowLeft, 
  BookOpen, Plus, Edit2, Trash2, Film, Calendar, DollarSign, 
  UploadCloud, AlertCircle, Play, X, CheckCircle, ShoppingBag, ToggleLeft, ToggleRight
} from 'lucide-react';
import Logo from '../components/Logo';
import ShinyText from '../components/ShinyText';
import { API_BASE_URL, parseResponse } from '../config';

// Resolves a thumbnail/video key or legacy full URL to a usable src URL.
// Supports both new R2 keys (e.g. "photo/uuid.jpg") and old full URLs.
const getMediaUrl = (keyOrUrl) => {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    // Legacy full URL — rewrite host to current API_BASE_URL for localhost compat
    try {
      const u = new URL(keyOrUrl);
      return `${API_BASE_URL}${u.pathname}`;
    } catch {
      return keyOrUrl;
    }
  }
  return `${API_BASE_URL}/api/media/${keyOrUrl}`;
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('users'); // users, courses, sales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab data
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, userCount: 0 });
  const [courses, setCourses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Menu modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuItemName, setMenuItemName] = useState('');
  const [menuItemDesc, setMenuItemDesc] = useState('');
  const [menuItemPrice, setMenuItemPrice] = useState('');
  const [menuItemCategory, setMenuItemCategory] = useState('Specials');
  const [menuItemImage, setMenuItemImage] = useState('');
  const [menuItemAvailable, setMenuItemAvailable] = useState(true);
  const [isUploadingMenuImg, setIsUploadingMenuImg] = useState(false);
  const [menuItemFlavours, setMenuItemFlavours] = useState([]);
  
  // Modals / forms
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null); // null means creating
  
  // Course form state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('');
  const [courseVideos, setCourseVideos] = useState([]); // array of vids
  const [courseValidityDays, setCourseValidityDays] = useState('365');
  
  // Video upload state
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  const videoFileRef = useRef(null);
  const navigate = useNavigate();

  // Load basic users dashboard data
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin authorization is required.');
      setLoading(false);
      return;
    }
    fetchUsersData();
  }, [user]);

  // Load courses or sales when switching tabs
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'sales') {
      fetchPurchases();
    } else if (activeTab === 'menu') {
      fetchMenuItems();
    }
  }, [activeTab]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message);
      setStats(data.stats);
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message);
      setCourses(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/purchases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message);
      setPurchases(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading sales logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLogCSV = (yearMonth) => {
    if (!yearMonth) return;

    const filtered = purchases.filter(p => {
      const date = new Date(p.purchasedAt);
      const ym = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      return ym === yearMonth;
    });

    if (filtered.length === 0) {
      alert('No logs found for the selected month');
      return;
    }

    const headers = ['Client Name', 'Client Email', 'Course Title', 'Revenue (INR)', 'Purchase Date'];
    const rows = filtered.map(p => {
      const clientName = p.userId?.name || 'Unknown User';
      const clientEmail = p.userId?.email || 'N/A';
      const courseTitle = p.courseId?.title || 'Deleted Course';
      const revenue = p.amount !== null && p.amount !== undefined ? p.amount : (p.courseId?.price || 0);
      const purchaseDate = new Date(p.purchasedAt).toLocaleString();

      return [
        `"${clientName.replace(/"/g, '""')}"`,
        `"${clientEmail.replace(/"/g, '""')}"`,
        `"${courseTitle.replace(/"/g, '""')}"`,
        revenue.toFixed(2),
        `"${purchaseDate.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_log_${yearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteMonthlyLogs = async (yearMonth) => {
    if (!yearMonth) return;

    const [year, month] = yearMonth.split('-');
    const monthName = getMonthName(yearMonth);
    const confirmDelete = window.confirm(`Are you sure you want to delete all sales logs for ${monthName}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/purchases/by-month/${year}/${parseInt(month, 10)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(response);
      if (response.ok) {
        alert(data.message || 'Successfully deleted logs.');
        setSelectedMonth('');
        fetchPurchases();
      } else {
        setError(data.message || 'Failed to delete logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error deleting monthly logs.');
    }
  };

  const getMonthName = (yearMonthStr) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.message);
      setMenuItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  // ─── MENU CRUD ──────────────────────────────────────────────────────────────
  const openCreateMenuModal = () => {
    setEditingMenuItem(null);
    setMenuItemName('');
    setMenuItemDesc('');
    setMenuItemPrice('');
    setMenuItemCategory('Specials');
    setMenuItemImage('');
    setMenuItemAvailable(true);
    setMenuItemFlavours([]);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item);
    setMenuItemName(item.name);
    setMenuItemDesc(item.description || '');
    setMenuItemPrice(item.price || '');
    setMenuItemCategory(item.category || 'Specials');
    setMenuItemImage(item.image || '');
    setMenuItemAvailable(item.isAvailable !== false);
    setMenuItemFlavours(item.flavours || []);
    setIsMenuModalOpen(true);
  };

  const handleAddFlavourRow = () => {
    setMenuItemFlavours(prev => [...prev, { name: '', price: '' }]);
  };

  const handleRemoveFlavourRow = (index) => {
    setMenuItemFlavours(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFlavourRowChange = (index, field, value) => {
    setMenuItemFlavours(prev => prev.map((flav, idx) => idx === index ? { ...flav, [field]: value } : flav));
  };

  const handleMenuImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    setIsUploadingMenuImg(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.message || 'Image upload failed');
      setMenuItemImage(data.fileId);
    } catch (err) {
      alert(err.message || 'Error uploading image');
    } finally {
      setIsUploadingMenuImg(false);
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!menuItemName) { alert('Name is required.'); return; }
    if (menuItemPrice === '' && menuItemFlavours.length === 0) {
      alert('Please specify either a flat price or at least one custom flavour with its price.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingMenuItem
        ? `${API_BASE_URL}/api/menu/${editingMenuItem._id}`
        : `${API_BASE_URL}/api/menu`;
      const method = editingMenuItem ? 'PUT' : 'POST';

      const parsedFlavours = menuItemFlavours.map(f => ({
        name: f.name,
        price: parseFloat(f.price)
      }));

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: menuItemName,
          description: menuItemDesc,
          price: menuItemPrice !== '' ? parseFloat(menuItemPrice) : 0,
          flavours: parsedFlavours,
          image: menuItemImage,
          category: menuItemCategory,
          isAvailable: menuItemAvailable
        })
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.message);
      setIsMenuModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Delete this menu item permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) { const d = await parseResponse(res); throw new Error(d.message); }
      fetchMenuItems();
    } catch (err) {
      alert(err.message || 'Failed to delete menu item');
    }
  };

  // Course operations
  const openCreateCourseModal = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseDescription('');
    setCoursePrice('');
    setCourseThumbnail('');
    setCourseVideos([]);
    setCourseValidityDays('365');
    setUploadError('');
    setIsCourseModalOpen(true);
  };

  const openEditCourseModal = (course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDescription(course.description || '');
    setCoursePrice(course.price);
    setCourseThumbnail(course.thumbnail || '');
    setCourseVideos(course.videos || []);
    setCourseValidityDays(course.validityDays !== undefined ? String(course.validityDays) : '365');
    setUploadError('');
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action is permanent.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await parseResponse(response);
        throw new Error(data.message);
      }
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleVideoUploadClick = async () => {
    const file = videoFileRef.current?.files?.[0];
    if (!file) {
      setUploadError('Please select a video file first');
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/media/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentage);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            const cleanTitle = videoTitleInput || file.name.replace(/\.[^/.]+$/, "");
            const newVideo = {
              title: cleanTitle,
              videoFileId: responseData.fileId,
              unlockDay: 1,
              durationDays: 9999
            };
            setCourseVideos(prev => [...prev, newVideo]);
            
            // Reset inputs
            setVideoTitleInput('');
            if (videoFileRef.current) videoFileRef.current.value = null;
            setIsUploadingVideo(false);
            setUploadProgress(0);
          } catch {
            setUploadError(`Upload succeeded but server returned an unexpected response (status: ${xhr.status})`);
            setIsUploadingVideo(false);
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            setUploadError(errData.message || `Upload failed with status: ${xhr.status}`);
          } catch {
            setUploadError(`Upload failed with status: ${xhr.status}`);
          }
          setIsUploadingVideo(false);
        }
      };

      xhr.onerror = () => {
        setUploadError('Network error uploading file directly to backend storage');
        setIsUploadingVideo(false);
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Error executing video upload');
      setIsUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Thumbnail upload failed');

      // Store only the R2 key so the URL is always constructed dynamically
      setCourseThumbnail(data.fileId);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error uploading thumbnail');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleRemoveVideo = (index) => {
    setCourseVideos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle || coursePrice === '') {
      alert('Course title and price are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingCourse 
        ? `${API_BASE_URL}/api/admin/courses/${editingCourse._id}` 
        : `${API_BASE_URL}/api/admin/courses`;
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
          price: parseFloat(coursePrice),
          thumbnail: courseThumbnail,
          videos: courseVideos,
          validityDays: parseInt(courseValidityDays) || 365
        })
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message);

      setIsCourseModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to save course');
    }
  };

  if (loading && activeTab === 'users') {
    return (
      <div className="auth-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--gold-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Baking Academy Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {activeTab === 'users' && 'Manage accounts and administrative roles.'}
            {activeTab === 'courses' && 'Create courses and configure video release timelines.'}
            {activeTab === 'sales' && 'Track client purchases and academy revenue.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/account')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} />
            My Account
          </button>
          
          <button onClick={handleLogoutClick} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--error)', color: '#ff7b7c' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Custom Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => { setActiveTab('users'); setError(''); }} 
          className="btn-secondary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: activeTab === 'users' ? 'rgba(229, 169, 60, 0.15)' : 'transparent',
            borderColor: activeTab === 'users' ? 'var(--gold-primary)' : 'var(--border-gold)'
          }}
        >
          <Users size={16} />
          Users List
        </button>

        <button 
          onClick={() => { setActiveTab('courses'); setError(''); }} 
          className="btn-secondary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: activeTab === 'courses' ? 'rgba(229, 169, 60, 0.15)' : 'transparent',
            borderColor: activeTab === 'courses' ? 'var(--gold-primary)' : 'var(--border-gold)'
          }}
        >
          <BookOpen size={16} />
          Manage Courses
        </button>

        <button 
          onClick={() => { setActiveTab('sales'); setError(''); }} 
          className="btn-secondary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: activeTab === 'sales' ? 'rgba(229, 169, 60, 0.15)' : 'transparent',
            borderColor: activeTab === 'sales' ? 'var(--gold-primary)' : 'var(--border-gold)'
          }}
        >
          <DollarSign size={16} />
          Sales Logs
        </button>

        <button 
          onClick={() => { setActiveTab('menu'); setError(''); }} 
          className="btn-secondary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: activeTab === 'menu' ? 'rgba(229, 169, 60, 0.15)' : 'transparent',
            borderColor: activeTab === 'menu' ? 'var(--gold-primary)' : 'var(--border-gold)'
          }}
        >
          <ShoppingBag size={16} />
          Manage Menu
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '2rem' }}><AlertCircle size={18} /> {error}</div>}

      {/* --- TAB CONTENT: USERS --- */}
      {activeTab === 'users' && (
        <>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-icon-wrapper"><Users size={24} /></div>
              <div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Accounts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 84, 85, 0.15)', color: '#ff7b7c' }}><Shield size={24} /></div>
              <div>
                <div className="stat-value" style={{ color: '#ff7b7c' }}>{stats.adminCount}</div>
                <div className="stat-label">Admin Accounts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(42, 199, 111, 0.15)', color: '#6eff9f' }}><UserCheck size={24} /></div>
              <div>
                <div className="stat-value" style={{ color: '#6eff9f' }}>{stats.userCount}</div>
                <div className="stat-label">User Accounts</div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header-row">
              <h2 className="table-title">Registered Accounts</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total: {users.length} accounts</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Auth Type</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.name} className="user-avatar" />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: '500' }}>{item.name}</td>
                      <td>{item.email}</td>
                      <td>
                        <span className={`role-tag ${item.role === 'admin' ? 'role-admin' : 'role-user'}`}>{item.role}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: item.googleId ? 'var(--gold-light)' : 'var(--text-secondary)' }}>
                          {item.googleId ? 'Google OAuth' : 'Credentials'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- TAB CONTENT: MENU --- */}
      {activeTab === 'menu' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Menu Management</h2>
            <button onClick={openCreateMenuModal} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              <Plus size={16} /> Add Menu Item
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', borderTopColor: 'var(--gold-primary)', margin: '0 auto' }} />
            </div>
          ) : menuItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <ShoppingBag size={56} style={{ color: 'var(--gold-primary)', opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)' }}>No Menu Items Yet</h3>
              <p style={{ marginTop: '0.5rem' }}>Click "Add Menu Item" to create your first dish.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {menuItems.map(item => (
                <div key={item._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Image */}
                  {item.image ? (
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-gold)' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '150px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-gold)' }}>
                      <ShoppingBag size={32} style={{ color: 'var(--gold-primary)', opacity: 0.3 }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{item.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', background: 'rgba(229,169,60,0.1)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>{item.category}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {item.flavours && item.flavours.length > 0 ? (
                        `From ₹${Math.min(...item.flavours.map(f => f.price))}`
                      ) : (
                        `₹${item.price}`
                      )}
                    </span>
                  </div>

                  {item.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</p>
                  )}

                  {item.flavours && item.flavours.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', border: '1px dashed var(--border-gold)' }}>
                      <strong style={{ color: 'var(--gold-primary)' }}>Flavours: </strong>
                      {item.flavours.map(f => `${f.name} (₹${f.price}/kg)`).join(', ')}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-gold)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: item.isAvailable ? 'var(--success)' : 'var(--error)' }}>
                      {item.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditMenuModal(item)} style={{ background: 'none', border: '1px solid var(--border-gold)', color: 'var(--gold-primary)', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDeleteMenuItem(item._id)} style={{ background: 'none', border: '1px solid rgba(234,84,85,0.3)', color: '#ff7b7c', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- TAB CONTENT: COURSES --- */}
      {activeTab === 'courses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Academy Course Catalog</h2>
            <button onClick={openCreateCourseModal} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              <Plus size={16} /> Add New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BookOpen size={48} style={{ color: 'var(--gold-primary)', opacity: 0.5, marginBottom: '1rem' }} />
              <h3>No Courses Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Create a course to begin adding video tutorials.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {courses.map(course => (
                <div key={course._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    {course.thumbnail ? (
                      <img src={getMediaUrl(course.thumbnail)} alt={course.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border-gold)' }} />
                    ) : (
                      <div style={{ width: '100%', height: '160px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border-gold)' }}>
                        <Film size={36} style={{ color: 'var(--gold-primary)', opacity: 0.3 }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{course.title}</h3>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '1.1rem' }}>₹{course.price}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                      {course.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(229, 169, 60, 0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>{course.videos ? course.videos.length : 0}</strong> video lessons
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditCourseModal(course)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteCourse(course._id)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', borderColor: 'var(--error)', color: '#ff7b7c' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- TAB CONTENT: SALES LOGS --- */}
      {activeTab === 'sales' && (
        <>
          <div className="table-card">
            <div className="table-header-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="table-title">Academy Registrations & Sales</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total Revenue: <strong style={{ color: 'var(--gold-primary)' }}>₹{purchases.reduce((acc, curr) => acc + (curr.amount !== null && curr.amount !== undefined ? curr.amount : (curr.courseId?.price || 0)), 0).toFixed(2)}</strong>
                </span>

                {purchases.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="input-field"
                      style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem', height: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-gold)', borderRadius: '6px' }}
                    >
                      <option value="">Select Month...</option>
                      {Array.from(
                        new Set(
                          purchases.map(p => {
                            const date = new Date(p.purchasedAt);
                            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                          })
                        )
                      )
                        .sort()
                        .reverse()
                        .map(ym => (
                          <option key={ym} value={ym}>{getMonthName(ym)}</option>
                        ))
                      }
                    </select>

                    <button
                      onClick={() => handleDownloadLogCSV(selectedMonth)}
                      disabled={!selectedMonth}
                      className="btn-primary"
                      style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', opacity: selectedMonth ? 1 : 0.5, cursor: selectedMonth ? 'pointer' : 'not-allowed', boxShadow: 'none' }}
                    >
                      Export CSV
                    </button>

                    <button
                      onClick={() => handleDeleteMonthlyLogs(selectedMonth)}
                      disabled={!selectedMonth}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: selectedMonth ? '#ea5455' : 'var(--border-gold)', color: selectedMonth ? '#ff7b7c' : 'var(--text-secondary)', opacity: selectedMonth ? 1 : 0.5, cursor: selectedMonth ? 'pointer' : 'not-allowed' }}
                    >
                      Delete Logs
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="table-container">
              {purchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No course purchases recorded in the system.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Client Email</th>
                      <th>Course Title</th>
                      <th>Revenue</th>
                      <th>Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((sale) => {
                      const revenue = sale.amount !== null && sale.amount !== undefined ? sale.amount : (sale.courseId?.price || 0);
                      return (
                        <tr key={sale._id}>
                          <td style={{ fontWeight: '500' }}>{sale.userId?.name || 'Unknown User'}</td>
                          <td>{sale.userId?.email || 'N/A'}</td>
                          <td style={{ fontWeight: '500', color: 'var(--gold-light)' }}>{sale.courseId?.title || 'Deleted Course'}</td>
                          <td style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>
                            ₹{revenue.toFixed(2)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {new Date(sale.purchasedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── MENU ITEM MODAL ──────────────────────────────────────── */}
      {isMenuModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button onClick={() => setIsMenuModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Item Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Red Velvet Cake"
                  value={menuItemName}
                  onChange={e => setMenuItemName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  placeholder="Short description of the item..."
                  value={menuItemDesc}
                  onChange={e => setMenuItemDesc(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Price & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Flat Price (₹) {menuItemFlavours.length === 0 && '*'}</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={menuItemPrice}
                    onChange={e => setMenuItemPrice(e.target.value)}
                    required={menuItemFlavours.length === 0}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Cakes, Pastries"
                    value={menuItemCategory}
                    onChange={e => setMenuItemCategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Flavours & Prices list */}
              <div style={{ border: '1px dashed var(--border-gold)', borderRadius: '10px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Flavours & Prices (per Kg)</label>
                  <button
                    type="button"
                    onClick={handleAddFlavourRow}
                    style={{ background: 'none', border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    + Add Flavour
                  </button>
                </div>

                {menuItemFlavours.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No custom flavours added. Item will use the flat price above.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {menuItemFlavours.map((flav, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Flavour name (e.g. Orange Caramel)"
                          value={flav.name}
                          onChange={e => handleFlavourRowChange(idx, 'name', e.target.value)}
                          style={{ flex: 2, padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-gold)' }}
                          required
                        />
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Price/Kg (₹)"
                          value={flav.price}
                          onChange={e => handleFlavourRowChange(idx, 'price', e.target.value)}
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-gold)' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFlavourRow(idx)}
                          style={{ background: 'none', border: 'none', color: '#ff7b7c', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Item Image</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px dashed var(--border-gold-focus)', borderRadius: '10px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                  {isUploadingMenuImg ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Uploading...</span>
                  ) : menuItemImage ? (
                    <span style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} /> Image uploaded — click to change
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UploadCloud size={16} /> Upload Image
                    </span>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMenuImageUpload} />
                </label>
                {menuItemImage && (
                  <img
                    src={getMediaUrl(menuItemImage)}
                    alt="Preview"
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid var(--border-gold)' }}
                  />
                )}
              </div>

              {/* Availability Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--border-gold)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Available on Menu</span>
                <button
                  type="button"
                  onClick={() => setMenuItemAvailable(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: menuItemAvailable ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  {menuItemAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  {menuItemAvailable ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsMenuModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editingMenuItem ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COURSE MANAGE MODAL (overlay) --- */}
      {isCourseModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-gold)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>
                {editingCourse ? `Edit Course: ${editingCourse.title}` : 'Create New Course'}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="courseTitle">Course Title</label>
                <input 
                  id="courseTitle"
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '1rem' }}
                  placeholder="Mastering Croissants"
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="coursePrice">Price (₹)</label>
                  <input 
                    id="coursePrice"
                    type="number" 
                    step="1"
                    className="input-field" 
                    style={{ paddingLeft: '1rem' }}
                    placeholder="2999"
                    value={coursePrice}
                    onChange={e => setCoursePrice(e.target.value)}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="courseValidity">Validity (Days)</label>
                  <input 
                    id="courseValidity"
                    type="number" 
                    step="1"
                    className="input-field" 
                    style={{ paddingLeft: '1rem' }}
                    placeholder="365"
                    value={courseValidityDays}
                    onChange={e => setCourseValidityDays(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Thumbnail Image</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%' }}
                    disabled={isUploadingThumbnail}
                  />
                  {isUploadingThumbnail && <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', whiteSpace: 'nowrap' }}>Uploading...</span>}
                </div>
                {courseThumbnail && (
                  <img 
                    src={courseThumbnail} 
                    alt="Thumbnail Preview" 
                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-gold)', marginTop: '0.5rem' }} 
                  />
                )}
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="courseDescription">Description</label>
                <textarea 
                  id="courseDescription"
                  className="input-field" 
                  style={{ paddingLeft: '1rem', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Provide an overview of this baking course..."
                  value={courseDescription}
                  onChange={e => setCourseDescription(e.target.value)}
                />
              </div>

              {/* Video Timeline Section */}
              <div style={{ border: '1px solid var(--border-gold)', borderRadius: '10px', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--gold-primary)' }}>
                  <Film size={16} /> Course Videos & Timelines
                </h4>

                {/* Upload Section */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border-gold)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Upload video directly to database:
                  </span>
                  
                  <input 
                    type="text"
                    placeholder="Video Title (e.g. Lesson 1: Making the Dough)"
                    className="input-field"
                    style={{ paddingLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}
                    value={videoTitleInput}
                    onChange={e => setVideoTitleInput(e.target.value)}
                  />

                  {/* Unlock Day and Access Duration removed per request */}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <input 
                      type="file" 
                      accept="video/*" 
                      ref={videoFileRef}
                      style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    />
                    
                    <button 
                      type="button" 
                      onClick={handleVideoUploadClick}
                      disabled={isUploadingVideo}
                      className="btn-primary" 
                      style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      {isUploadingVideo ? 'Uploading...' : (
                        <>
                          <UploadCloud size={14} /> Upload Video
                        </>
                      )}
                    </button>
                  </div>

                  {isUploadingVideo && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--gold-primary)', transition: 'width 0.1s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                        Uploading: {uploadProgress}%
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <div style={{ color: '#ff7b7c', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <AlertCircle size={14} /> {uploadError}
                    </div>
                  )}
                </div>

                {/* Added Videos List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {courseVideos.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center', padding: '0.5rem' }}>
                      No videos uploaded yet.
                    </span>
                  ) : (
                    courseVideos.map((vid, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(229, 169, 60, 0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{vid.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: <code style={{ color: 'var(--gold-light)' }}>{vid.videoFileId}</code>
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveVideo(idx)}
                          style={{ background: 'none', border: 'none', color: '#ff7b7c', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-gold)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
