import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  List,
  ListItem,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Logout,
  DarkMode,
  LightMode,
  CheckCircle,
  Cancel,
  Assignment,
  School,
  Visibility,
  HourglassEmpty,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import { getStatusColor } from '../theme';
import api, { formatTeacherName } from '../services/api';
import SyllabusTemplate from '../components/SyllabusTemplate';

const HeadDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [syllabi, setSyllabi] = useState([]);
  const [allSyllabi, setAllSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'head') {
      alert('Access denied. Department Head privileges required.');
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get('/syllabi/pending'),
        api.get('/syllabi/all'),
      ]);
      setSyllabi(pendingRes.data);
      setAllSyllabi(allRes.data);
    } catch (error) {
      console.error('Failed to fetch syllabi:', error);
    }
    setLoading(false);
  };

  const handleStatus = async (id, status, reason = '') => {
    try {
      await api.put(`/syllabi/${id}/status`, { status, reason });
      fetchData();
      if (status === 'approved') {
        alert('Syllabus approved successfully!');
      } else {
        alert('Syllabus rejected.');
      }
    } catch (error) {
      alert('Failed to update status');
    }
    setShowRejectDialog(false);
    setRejectReason('');
    setSelectedSyllabus(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pendingSyllabi = syllabi.filter(s => s.status === 'pending');
  const approvedCount = allSyllabi.filter(s => s.status === 'approved').length;
  const rejectedCount = allSyllabi.filter(s => s.status === 'rejected').length;

  const statCards = [
    { title: 'Pending Review', count: pendingSyllabi.length, icon: HourglassEmpty, color: 'warning', desc: 'Syllabus awaiting your review' },
    { title: 'Approved', count: approvedCount, icon: ThumbUp, color: 'success', desc: 'Syllabus you\'ve approved' },
    { title: 'Rejected', count: rejectedCount, icon: ThumbDown, color: 'error', desc: 'Syllabus you\'ve rejected' },
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
                  bgcolor: alpha(theme.palette.warning.main, 0.18),
                  color: 'warning.main',
                }}
              >
                <Assignment sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Department Head Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and approve syllabi submissions
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={colorMode.toggleColorMode}>
                {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
              <Button variant="outlined" startIcon={<Logout />} onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card
                sx={{
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
                  <Typography variant="body2" color="text.secondary">
                    {stat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pending Syllabus Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Pending Syllabus for Review
              </Typography>
              <Chip label={pendingSyllabi.length} color="warning" size="small" />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingSyllabi.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No syllabus pending review at this time. Great job staying on top of reviews!
              </Alert>
            ) : (
              <List disablePadding>
                {pendingSyllabi.map(syllabus => (
                  <Paper
                    key={syllabus.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <School />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {syllabus.template_data?.courseTitle || `Syllabus #${syllabus.id}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {syllabus.template_data?.courseCode && `Code: ${syllabus.template_data.courseCode} | `}
                            Teacher: {syllabus.teacher_email ? formatTeacherName(syllabus.teacher_email) : 'Unknown'} |
                            Version: {syllabus.version || 1}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="View Template">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedSyllabus(syllabus);
                              setShowTemplate(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            View
                          </Button>
                        </Tooltip>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleStatus(syllabus.id, 'approved')}
                          sx={{ borderRadius: 2 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => {
                            setSelectedSyllabus(syllabus);
                            setShowRejectDialog(true);
                          }}
                          sx={{ borderRadius: 2 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recently Reviewed
            </Typography>
            {allSyllabi.filter(s => s.status === 'approved' || s.status === 'rejected').length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No syllabi have been reviewed yet.
              </Typography>
            ) : (
              <List disablePadding>
                {allSyllabi
                  .filter(s => s.status === 'approved' || s.status === 'rejected')
                  .slice(0, 5)
                  .map(syllabus => (
                    <ListItem
                      key={syllabus.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: alpha(
                          syllabus.status === 'approved'
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          0.04
                        ),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: syllabus.status === 'approved' ? 'success.main' : 'error.main',
                          }}
                        >
                          {syllabus.status === 'approved' ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {syllabus.template_data?.courseTitle || `Syllabus #${syllabus.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Version {syllabus.version || 1}
                          </Typography>
                        </Box>
                        <Chip
                          label={syllabus.status}
                          size="small"
                          color={getStatusColor(syllabus.status)}
                          sx={{ height: 24 }}
                        />
                      </Box>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectReason('');
          setSelectedSyllabus(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.error.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          Reject Syllabus
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejection (optional but recommended):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter feedback for the teacher to help them improve their syllabus..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowRejectDialog(false);
              setRejectReason('');
              setSelectedSyllabus(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleStatus(selectedSyllabus?.id, 'rejected', rejectReason)}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Viewer */}
      <Dialog
        open={showTemplate}
        onClose={() => {
          setShowTemplate(false);
          setSelectedSyllabus(null);
        }}
        maxWidth="xl"
        fullWidth
        fullScreen
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          Review Syllabus: {selectedSyllabus?.template_data?.courseTitle || `Syllabus #${selectedSyllabus?.id}`}
          <Button
            onClick={() => {
              setShowTemplate(false);
              setSelectedSyllabus(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedSyllabus && (
            <SyllabusTemplate
              syllabus={selectedSyllabus}
              onClose={() => {
                setShowTemplate(false);
                setSelectedSyllabus(null);
              }}
              mode="view"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HeadDashboard;
