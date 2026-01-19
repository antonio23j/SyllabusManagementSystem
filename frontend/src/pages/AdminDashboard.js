import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Logout,
  SwapHoriz,
  DarkMode,
  LightMode,
  People,
  Business,
  MenuBook,
  Description,
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import { getStatusColor } from '../theme';
import api, { formatTeacherName } from '../services/api';
import SyllabusTemplate from '../components/SyllabusTemplate';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [openUser, setOpenUser] = useState(false);
  const [openDept, setOpenDept] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);
  const [openSyllabus, setOpenSyllabus] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [reassigningSubject, setReassigningSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: '', department_id: '' });
  const [newDept, setNewDept] = useState({ name: '', head_id: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', department_id: '' });
  const [newSyllabus, setNewSyllabus] = useState({ subject_id: '', teacher_id: '' });
  const [assignment, setAssignment] = useState({ teacher_id: '', subject_id: '' });
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      navigate('/login');
      return;
    }

    fetchUsers();
    fetchDepartments();
    fetchSubjects();
    fetchSyllabi();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        console.error('Failed to fetch users:', error);
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        console.error('Failed to fetch departments:', error);
      }
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        console.error('Failed to fetch subjects:', error);
      }
    }
  };

  const fetchSyllabi = async () => {
    try {
      const response = await api.get('/syllabi/all');
      setSyllabi(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        console.error('Failed to fetch syllabi:', error);
      }
    }
  };

  const getErrorMessage = (error) => {
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message).join(', ');
      } else if (typeof error.response.data.detail === 'object') {
        return JSON.stringify(error.response.data.detail);
      }
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message || 'An error occurred';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleReassignSubject = (subject) => {
    setReassigningSubject(subject);
    setSelectedTeacher('');
  };

  const handleReassignSubmit = async () => {
    if (!reassigningSubject || !selectedTeacher) return;

    try {
      await api.post('/subjects/assign', {
        teacher_id: parseInt(selectedTeacher),
        subject_id: reassigningSubject.id
      });
      alert('Subject reassigned successfully');
      setReassigningSubject(null);
      setSelectedTeacher('');
      fetchSubjects();
      fetchSyllabi();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.role || !newUser.department_id) {
        alert('Please fill in all required fields: email, role, and department.');
        return;
      }

      if (!editingUser && !newUser.password) {
        alert('Password is required for new users.');
        return;
      }

      const userData = {
        email: newUser.email,
        role: newUser.role,
        department_id: parseInt(newUser.department_id),
      };

      if (editingUser) {
        if (newUser.password) {
          userData.password = newUser.password;
        }
        await api.put(`/users/${editingUser.id}`, userData);
        setEditingUser(null);
        alert('User updated successfully!');
      } else {
        userData.password = newUser.password;
        await api.post('/users', userData);
        alert('User created successfully!');
      }

      setOpenUser(false);
      setNewUser({ email: '', password: '', role: '', department_id: '' });
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(`Failed to save user: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleCreateDept = async () => {
    try {
      if (!newDept.name) {
        alert('Department name is required.');
        return;
      }

      const deptData = {
        name: newDept.name,
        head_id: newDept.head_id ? parseInt(newDept.head_id) : null,
      };

      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, deptData);
        setEditingDept(null);
        alert('Department updated successfully!');
      } else {
        await api.post('/departments', deptData);
        alert('Department created successfully!');
      }

      setOpenDept(false);
      setNewDept({ name: '', head_id: '' });
      fetchDepartments();
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(`Failed to save department: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleCreateSubject = async () => {
    try {
      if (!newSubject.name || !newSubject.code || !newSubject.department_id) {
        alert('Please fill in all required fields: name, code, and department.');
        return;
      }

      const subjectData = {
        name: newSubject.name,
        code: newSubject.code,
        department_id: parseInt(newSubject.department_id),
      };

      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, subjectData);
        setEditingSubject(null);
        alert('Subject updated successfully!');
      } else {
        await api.post('/subjects', subjectData);
        alert('Subject created successfully!');
      }

      setOpenSubject(false);
      setNewSubject({ name: '', code: '', department_id: '' });
      fetchSubjects();
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(`Failed to save subject: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleCreateSyllabus = async () => {
    try {
      if (!newSyllabus.subject_id || !newSyllabus.teacher_id) {
        alert('Please select a subject and teacher.');
        return;
      }

      const syllabusData = {
        subject_id: parseInt(newSyllabus.subject_id),
        teacher_id: parseInt(newSyllabus.teacher_id),
        template_data: newSyllabus.template_data || {},
        status: newSyllabus.status
      };

      if (editingSyllabus) {
        await api.put(`/syllabi/${editingSyllabus.id}`, syllabusData);
        setEditingSyllabus(null);
        alert('Syllabus updated successfully!');
      } else {
        await api.post('/syllabi', syllabusData);
        alert('Syllabus created successfully!');
      }

      setOpenSyllabus(false);
      setNewSyllabus({ subject_id: '', teacher_id: '', template_data: {}, status: 'draft' });
      fetchSyllabi();
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(`Failed to save syllabus: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleAssignSubject = async () => {
    if (assignment.teacher_id && assignment.subject_id) {
      try {
        await api.post('/subjects/assign', assignment);
        setAssignment({ teacher_id: '', subject_id: '' });
        alert('Subject assigned successfully!');
      } catch (error) {
        alert(`Failed to assign subject: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleEditSyllabus = (syllabus) => {
    setEditingSyllabus(syllabus);
    setNewSyllabus({
      subject_id: syllabus.subject_id,
      teacher_id: syllabus.teacher_id,
      template_data: syllabus.template_data || {},
      status: syllabus.status
    });
    setOpenSyllabus(true);
  };

  const handleDeleteSyllabus = async (syllabusId) => {
    if (window.confirm('Are you sure you want to delete this syllabus?')) {
      try {
        await api.delete(`/syllabi/${syllabusId}`);
        fetchSyllabi();
        alert('Syllabus deleted successfully!');
      } catch (error) {
        alert(`Failed to delete syllabus: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleViewTemplate = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setShowTemplate(true);
  };

  const handleCloseTemplate = () => {
    setShowTemplate(false);
    setSelectedSyllabus(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      password: '',
      role: user.role,
      department_id: user.department_id
    });
    setOpenUser(true);
  };

  const handleEditDept = (dept) => {
    setEditingDept(dept);
    setNewDept({
      name: dept.name,
      head_id: dept.head_id || ''
    });
    setOpenDept(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setNewSubject({
      name: subject.name,
      code: subject.code,
      department_id: subject.department_id
    });
    setOpenSubject(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        alert(`Failed to delete user: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleDeleteDept = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${deptId}`);
        fetchDepartments();
        alert('Department deleted successfully!');
      } catch (error) {
        alert(`Failed to delete department: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/subjects/${subjectId}`);
        fetchSubjects();
        alert('Subject deleted successfully!');
      } catch (error) {
        alert(`Failed to delete subject: ${getErrorMessage(error)}`);
      }
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin': return 'primary';
      case 'teacher': return 'secondary';
      case 'head': return 'warning';
      default: return 'default';
    }
  };

  const listItemBaseSx = (paletteColor, actionWidth = 112) => ({
    borderRadius: 2,
    mb: 1,
    px: 1.5,
    py: 1,
    pr: `${actionWidth}px`,
    border: '1px solid',
    borderColor: alpha(theme.palette[paletteColor].main, 0.15),
    bgcolor: alpha(theme.palette[paletteColor].main, 0.04),
    alignItems: 'center',
    '&:hover': {
      bgcolor: alpha(theme.palette[paletteColor].main, 0.08),
    },
  });

  const actionButtonSx = {
    bgcolor: alpha(theme.palette.common.black, 0.04),
    border: '1px solid',
    borderColor: 'divider',
    flexShrink: 0,
    '&:hover': {
      bgcolor: alpha(theme.palette.common.black, 0.08),
    },
  };
  const wideActionWidth = 140;

  // Stat card data
  const statCards = [
    { title: 'Users', count: users.length, icon: People, color: 'primary', desc: 'Manage system users and roles', action: () => setOpenUser(true), actionLabel: 'Add User' },
    { title: 'Departments', count: departments.length, icon: Business, color: 'secondary', desc: 'Organize academic departments', action: () => setOpenDept(true), actionLabel: 'Add Department' },
    { title: 'Subjects', count: subjects.length, icon: MenuBook, color: 'info', desc: 'Manage course subjects', action: () => setOpenSubject(true), actionLabel: 'Add Subject' },
    { title: 'Syllabi', count: syllabi.length, icon: Description, color: 'success', desc: 'Course syllabi and templates', action: () => setOpenSyllabus(true), actionLabel: 'Manage Syllabi' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at top right, rgba(31, 75, 153, 0.12), transparent 55%), radial-gradient(circle at bottom left, rgba(15, 118, 110, 0.1), transparent 50%)'
          : 'radial-gradient(circle at top right, rgba(99, 165, 255, 0.12), transparent 55%), radial-gradient(circle at bottom left, rgba(79, 209, 197, 0.12), transparent 50%)',
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Paper
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,251,253,0.85) 100%)'
              : 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.85) 100%)',
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: 'primary.main',
                }}
              >
                <People sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage users, departments, subjects, and syllabi
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={colorMode.toggleColorMode}>
                {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderColor: alpha(theme.palette[stat.color].main, 0.2),
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette[stat.color].main, 0.1),
                        color: `${stat.color}.main`,
                      }}
                    >
                      <stat.icon />
                    </Avatar>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: `${stat.color}.main` }}>
                      {stat.count}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {stat.desc}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color={stat.color}
                    startIcon={<Add />}
                    onClick={stat.action}
                    sx={{ borderRadius: 2 }}
                  >
                    {stat.actionLabel}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Assign Subjects Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Assign Subjects to Teachers
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Teacher</InputLabel>
                <Select
                  label="Teacher"
                  value={assignment.teacher_id}
                  onChange={(e) => setAssignment({ ...assignment, teacher_id: e.target.value })}
                >
                  {users.filter(user => user.role === 'teacher').map(teacher => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {formatTeacherName(teacher.email)} ({teacher.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  label="Subject"
                  value={assignment.subject_id}
                  onChange={(e) => setAssignment({ ...assignment, subject_id: e.target.value })}
                >
                  {subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleAssignSubject}
                disabled={!assignment.teacher_id || !assignment.subject_id}
                sx={{ height: 56 }}
              >
                Assign Subject
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Lists Section */}
        <Grid container spacing={3}>
          {/* Users List */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Users</Typography>
                  <Chip label={users.length} size="small" color="primary" />
                </Box>
                <List dense sx={{ maxHeight: 320, overflow: 'auto', pr: 0.5 }}>
                  {users.map(user => (
                    <ListItem
                      key={user.id}
                      sx={listItemBaseSx('primary')}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditUser(user)} sx={actionButtonSx}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)} sx={actionButtonSx}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        sx={{ pr: 2 }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.email}
                            </Typography>
                            <Chip
                              label={user.role}
                              size="small"
                              color={getRoleChipColor(user.role)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Departments List */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Departments</Typography>
                  <Chip label={departments.length} size="small" color="secondary" />
                </Box>
                <List dense sx={{ maxHeight: 320, overflow: 'auto', pr: 0.5 }}>
                  {departments.map(dept => (
                    <ListItem
                      key={dept.id}
                      sx={listItemBaseSx('secondary')}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditDept(dept)} sx={actionButtonSx}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteDept(dept.id)} sx={actionButtonSx}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText sx={{ pr: 2 }} primary={dept.name} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Subjects List */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Subjects</Typography>
                  <Chip label={subjects.length} size="small" color="info" />
                </Box>
                <List dense sx={{ maxHeight: 320, overflow: 'auto', pr: 0.5 }}>
                  {subjects.map(subject => {
                    const assignments = users.filter(user =>
                      user.role === 'teacher' &&
                      syllabi.some(s => s.subject_id === subject.id && s.teacher_id === user.id)
                    );
                    const assignedTeachers = assignments.map(teacher => formatTeacherName(teacher.email)).join(', ');

                    return (
                      <ListItem
                        key={subject.id}
                        sx={listItemBaseSx('info', wideActionWidth)}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Reassign">
                              <IconButton size="small" onClick={() => handleReassignSubject(subject)} sx={actionButtonSx}>
                                <SwapHoriz fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditSubject(subject)} sx={actionButtonSx}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteSubject(subject.id)} sx={actionButtonSx}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          sx={{
                            pr: 2,
                            minWidth: 0,
                            '& .MuiListItemText-primary, & .MuiListItemText-secondary': {
                              whiteSpace: 'normal',
                              wordBreak: 'normal',
                              overflowWrap: 'break-word',
                            },
                          }}
                          primary={subject.name}
                          secondary={`${subject.code}${assignedTeachers ? ` - ${assignedTeachers}` : ''}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Syllabi List */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Syllabi</Typography>
                  <Chip label={syllabi.length} size="small" color="success" />
                </Box>
                <List dense sx={{ maxHeight: 320, overflow: 'auto', pr: 0.5 }}>
                  {syllabi.map(syllabus => {
                    const subject = subjects.find(s => s.id === syllabus.subject_id);
                    const teacher = users.find(u => u.id === syllabus.teacher_id);
                    return (
                      <ListItem
                        key={syllabus.id}
                        sx={listItemBaseSx('success', wideActionWidth)}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Template">
                              <IconButton size="small" onClick={() => handleViewTemplate(syllabus)} sx={actionButtonSx}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditSyllabus(syllabus)} sx={actionButtonSx}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteSyllabus(syllabus.id)} sx={actionButtonSx}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          sx={{
                            pr: 2,
                            maxWidth: `calc(100% - ${wideActionWidth}px)`,
                            '& .MuiListItemText-primary, & .MuiListItemText-secondary': {
                              whiteSpace: 'normal',
                              wordBreak: 'normal',
                              overflowWrap: 'break-word',
                            },
                          }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {subject?.name || 'Unknown'} (v{syllabus.version})
                              </Typography>
                              <Chip
                                label={syllabus.status}
                                size="small"
                                color={getStatusColor(syllabus.status)}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={`Teacher: ${teacher ? formatTeacherName(teacher.email) : 'Unknown'}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* User Dialog */}
      <Dialog
        open={openUser}
        onClose={() => { setOpenUser(false); setEditingUser(null); setNewUser({ email: '', password: '', role: '', department_id: '' }); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            fullWidth
            margin="dense"
            type="email"
          />
          <TextField
            label={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              label="Role"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="head">Department Head</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Department</InputLabel>
            <Select
              value={newUser.department_id}
              label="Department"
              onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenUser(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={!newUser.email || (!editingUser && !newUser.password) || !newUser.role || !newUser.department_id}
          >
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog
        open={openDept}
        onClose={() => { setOpenDept(false); setEditingDept(null); setNewDept({ name: '', head_id: '' }); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {editingDept ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Department Name"
            value={newDept.name}
            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Department Head (Optional)</InputLabel>
            <Select
              value={newDept.head_id || ''}
              label="Department Head (Optional)"
              onChange={(e) => setNewDept({ ...newDept, head_id: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {users.filter(user => user.role === 'head').map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDept(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDept}
            variant="contained"
            disabled={!newDept.name}
          >
            {editingDept ? 'Update Department' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog
        open={openSubject}
        onClose={() => { setOpenSubject(false); setEditingSubject(null); setNewSubject({ name: '', code: '', department_id: '' }); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {editingSubject ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Subject Name"
            value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Subject Code"
            value={newSubject.code}
            onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
            fullWidth
            margin="dense"
            placeholder="e.g., CS101"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Department</InputLabel>
            <Select
              value={newSubject.department_id}
              label="Department"
              onChange={(e) => setNewSubject({ ...newSubject, department_id: e.target.value })}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSubject(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSubject}
            variant="contained"
            disabled={!newSubject.name || !newSubject.code || !newSubject.department_id}
          >
            {editingSubject ? 'Update Subject' : 'Create Subject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Syllabus Dialog */}
      <Dialog
        open={openSyllabus}
        onClose={() => { setOpenSyllabus(false); setEditingSyllabus(null); setNewSyllabus({ subject_id: '', teacher_id: '', template_data: {}, status: 'draft' }); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {editingSyllabus ? 'Edit Syllabus' : 'Manage Syllabus'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Subject</InputLabel>
            <Select
              value={newSyllabus.subject_id}
              label="Subject"
              onChange={(e) => setNewSyllabus({ ...newSyllabus, subject_id: e.target.value })}
            >
              {subjects.map(subject => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Teacher</InputLabel>
            <Select
              value={newSyllabus.teacher_id}
              label="Teacher"
              onChange={(e) => setNewSyllabus({ ...newSyllabus, teacher_id: e.target.value })}
            >
              {users.filter(user => user.role === 'teacher').map(teacher => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {formatTeacherName(teacher.email)} ({teacher.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={newSyllabus.status}
              label="Status"
              onChange={(e) => setNewSyllabus({ ...newSyllabus, status: e.target.value })}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          {editingSyllabus && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Version: {editingSyllabus.version}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenSyllabus(false); setEditingSyllabus(null); setNewSyllabus({ subject_id: '', teacher_id: '', template_data: {}, status: 'draft' }); }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSyllabus}
            variant="contained"
            disabled={!newSyllabus.subject_id || !newSyllabus.teacher_id}
          >
            {editingSyllabus ? 'Update Syllabus' : 'Create Syllabus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Reassignment Dialog */}
      <Dialog open={!!reassigningSubject} onClose={() => setReassigningSubject(null)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.warning.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          Reassign Subject
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {reassigningSubject && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Reassign <strong>{reassigningSubject.name}</strong> ({reassigningSubject.code}) to a different teacher:
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Teacher</InputLabel>
                <Select
                  value={selectedTeacher}
                  label="Select Teacher"
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  {users.filter(user => user.role === 'teacher').map(teacher => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {formatTeacherName(teacher.email)} ({teacher.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReassigningSubject(null)}>Cancel</Button>
          <Button
            onClick={handleReassignSubmit}
            variant="contained"
            disabled={!selectedTeacher}
          >
            Reassign Subject
          </Button>
        </DialogActions>
      </Dialog>

      {showTemplate && (
        <SyllabusTemplate
          syllabus={selectedSyllabus}
          onClose={handleCloseTemplate}
        />
      )}
    </Box>
  );
};

export default AdminDashboard;
