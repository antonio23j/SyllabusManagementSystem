import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Button, Card, CardContent, CardActions,
  List, ListItem, ListItemText, TextField, Box, Select, MenuItem,
  FormControl, InputLabel, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Avatar, Accordion, AccordionSummary, AccordionDetails,
  IconButton, Paper
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  School, Add, ExpandMore, PictureAsPdf, Logout,
  DarkMode, LightMode, MenuBook, Description
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import { getStatusColor } from '../theme';
import api from '../services/api';
import SyllabusTemplate from '../components/SyllabusTemplate';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openVersion, setOpenVersion] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [openViewTemplate, setOpenViewTemplate] = useState(false);
  const { control, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchSubjects();
    fetchSyllabi();
  }, []);

  const fetchSubjects = async () => {
    const response = await api.get('/subjects/my', { params: { skip: 0, limit: 1000 } });
    setSubjects(response.data);
  };

  const fetchSyllabi = async () => {
    const response = await api.get('/syllabi/my', { params: { skip: 0, limit: 1000 } });
    setSyllabi(response.data);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTemplateSave = async (templateData) => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    const syllabusData = {
      subject_id: selectedSubject.id,
      template_data: templateData,
      status: 'draft'
    };

    try {
      await api.post('/syllabi', syllabusData);
      alert('Syllabus created successfully');
      setOpenTemplate(false);
      fetchSyllabi();
    } catch (error) {
      console.error('Error creating syllabus:', error);
      alert('Error creating syllabus');
    }
  };

  const onVersionSubmit = async (data) => {
    const versionData = {
      subject_id: selectedSyllabus.subject_id,
      template_data: data,
      status: 'draft'
    };
    await api.post('/syllabi', versionData);
    alert('New syllabus version created successfully');
    reset();
    setOpenVersion(false);
    fetchSyllabi();
  };

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
                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                  color: 'secondary.main',
                }}
              >
                <School sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Teacher Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your syllabi and course content
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
        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderColor: alpha(theme.palette.secondary.main, 0.2),
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: 'secondary.main',
                    }}
                  >
                    <MenuBook />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {subjects.length}
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  My Subjects
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Subjects assigned to you
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {subjects.map(subject => (
                    <ListItem
                      key={subject.id}
                      sx={{
                        px: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.04),
                      }}
                    >
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <Description />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {syllabi.length}
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  My Syllabi
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Syllabi you've created
                </Typography>
                {syllabi.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No syllabi created yet
                  </Typography>
                ) : (
                  <List dense sx={{ maxHeight: 100, overflow: 'auto' }}>
                    {syllabi.slice(0, 3).map(syllabus => (
                      <ListItem
                        key={syllabus.id}
                        sx={{
                          px: 1,
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                            {subjects.find(s => s.id === syllabus.subject_id)?.name || 'Unknown Subject'}
                          </Typography>
                          <Chip
                            label={syllabus.status}
                            size="small"
                            color={getStatusColor(syllabus.status)}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenCreate(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Create Syllabus
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Syllabus Management Section */}
        {syllabi.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Syllabus Management
              </Typography>
              {syllabi.map(syllabus => (
                <Accordion
                  key={syllabus.id}
                  sx={{
                    mb: 1.5,
                    '&:before': { display: 'none' },
                    boxShadow: theme.shadows[2],
                    '&.Mui-expanded': {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        {subjects.find(s => s.id === syllabus.subject_id)?.name || 'Unknown Subject'}
                      </Typography>
                      <Chip
                        label={syllabus.status}
                        size="small"
                        color={getStatusColor(syllabus.status)}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Version {syllabus.version || 1}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Current Syllabus Data:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          bgcolor: theme.palette.mode === 'light'
                            ? alpha(theme.palette.primary.main, 0.04)
                            : alpha(theme.palette.common.white, 0.05),
                          p: 2,
                          borderRadius: 2,
                          fontSize: '0.8rem',
                          overflow: 'auto',
                          border: '1px solid',
                          borderColor: 'divider',
                          maxHeight: 200,
                        }}
                      >
                        {JSON.stringify(syllabus.template_data, null, 2)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          console.log('View Template clicked for:', syllabus);
                          setSelectedSyllabus(syllabus);
                          setOpenViewTemplate(true);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        View Template
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedSyllabus(syllabus);
                          setOpenViewTemplate(true);
                        }}
                        startIcon={<PictureAsPdf />}
                        sx={{ borderRadius: 2 }}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedSyllabus(syllabus);
                          setOpenVersion(true);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        Create New Version
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Create Syllabus Dialog */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
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
          Create New Syllabus
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a subject to create a syllabus template
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Subject</InputLabel>
            <Select
              value={selectedSubject?.id || ''}
              label="Select Subject"
              onChange={(e) => setSelectedSubject(subjects.find(s => s.id === e.target.value))}
            >
              {subjects.map(subject => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenCreate(false);
              setOpenTemplate(true);
            }}
            variant="contained"
            disabled={!selectedSubject}
          >
            Next: Fill Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version Dialog */}
      <Dialog
        open={openVersion}
        onClose={() => setOpenVersion(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          Create New Version
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedSyllabus && (
            <Box component="form">
              <Typography variant="h6" gutterBottom>
                New Version for {subjects.find(s => s.id === selectedSyllabus.subject_id)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Modify the syllabus details below to create a new version
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Subject Typology</InputLabel>
                    <Controller
                      name="typology"
                      control={control}
                      defaultValue={selectedSyllabus.template_data?.typology || ""}
                      render={({ field }) => (
                        <Select {...field} label="Subject Typology">
                          <MenuItem value="A">A - Basic</MenuItem>
                          <MenuItem value="B">B - Intermediate</MenuItem>
                          <MenuItem value="C">C - Advanced</MenuItem>
                          <MenuItem value="D">D - Specialized</MenuItem>
                          <MenuItem value="E">E - Research</MenuItem>
                          <MenuItem value="F">F - Practical</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Subject Type</InputLabel>
                    <Controller
                      name="type"
                      control={control}
                      defaultValue={selectedSyllabus.template_data?.type || ""}
                      render={({ field }) => (
                        <Select {...field} label="Subject Type">
                          <MenuItem value="compulsory">Compulsory</MenuItem>
                          <MenuItem value="optional">Optional</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="credits"
                    control={control}
                    defaultValue={selectedSyllabus.template_data?.credits || ""}
                    render={({ field }) => (
                      <TextField {...field} label="Credits" type="number" fullWidth margin="normal" />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="schedule"
                    control={control}
                    defaultValue={selectedSyllabus.template_data?.schedule || ""}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Schedule (Year, Semester, Hours)"
                        fullWidth
                        margin="normal"
                        multiline
                        rows={2}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenVersion(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit(onVersionSubmit)}
            variant="contained"
          >
            Create Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Syllabus Template Dialog */}
      <Dialog
        open={openTemplate}
        onClose={() => setOpenTemplate(false)}
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
          Create Syllabus Template for {selectedSubject?.name}
          <Button
            onClick={() => setOpenTemplate(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <SyllabusTemplate
            syllabus={null}
            onClose={() => setOpenTemplate(false)}
            onSave={handleTemplateSave}
            mode="create"
            selectedSubject={selectedSubject}
          />
        </DialogContent>
      </Dialog>

      {/* View Syllabus Template Dialog */}
      <Dialog
        open={openViewTemplate}
        onClose={() => setOpenViewTemplate(false)}
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
          Syllabus Template for {selectedSyllabus ? subjects.find(s => s.id === selectedSyllabus.subject_id)?.name : ''}
          <Button
            onClick={() => setOpenViewTemplate(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedSyllabus && (
            <SyllabusTemplate
              syllabus={selectedSyllabus}
              onClose={() => setOpenViewTemplate(false)}
              mode="view"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TeacherDashboard;
