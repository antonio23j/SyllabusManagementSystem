import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PictureAsPdf, Save, Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api, { formatTeacherName } from '../services/api';

const SyllabusTemplate = ({ syllabus, onClose, onSave, mode = 'view', selectedSubject = null }) => {
  const theme = useTheme();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const downloadBackendPDF = async () => {
    if (!syllabus) return;

    try {
      const response = await api.get(`/syllabi/${syllabus.id}/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'syllabus.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  const templateRef = useRef(null);
  const [templateData, setTemplateData] = useState({
    courseTitle: selectedSubject ? selectedSubject.name : '',
    courseCode: selectedSubject ? selectedSubject.code : '',
    instructor: formatTeacherName(currentUser.email),
    email: currentUser.email || '',
    officeHours: '',
    typology: '',
    type: '',
    year: '',
    semester: '',
    additionalDescription: '',
    courseDescription: '',
    learningObjectives: '',
    prerequisites: '',
    textbooks: '',
    gradingPolicy: '',
    attendancePolicy: '',
    academicIntegrity: '',
    schedule: '',
    ...syllabus?.template_data
  });

  const handleInputChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = async () => {
    if (!templateRef.current) return;

    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`syllabus-${templateData.courseCode || 'template'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const isFormValid = templateData.courseTitle && templateData.courseCode;

  const handleSave = () => {
    if (onSave) {
      const courseDescription = `Year ${templateData.year || '...'} Semester ${templateData.semester || '...'} 15 weeks ${templateData.additionalDescription || '.........'}`;

      const dataToSave = {
        ...templateData,
        courseDescription
      };

      onSave(dataToSave);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: 'background.default',
        minHeight: '100%',
        backgroundImage: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at top right, rgba(31, 75, 153, 0.08), transparent 55%), radial-gradient(circle at bottom left, rgba(15, 118, 110, 0.08), transparent 50%)'
          : 'radial-gradient(circle at top right, rgba(99, 165, 255, 0.08), transparent 55%), radial-gradient(circle at bottom left, rgba(79, 209, 197, 0.08), transparent 50%)',
      }}
    >
      <Paper
        sx={{
          mb: 3,
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          border: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,251,253,0.85) 100%)'
            : 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.85) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {mode === 'create' ? 'Create Syllabus Template' : 'Syllabus Template'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete the fields and preview the PDF-ready layout.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={onClose} startIcon={<Close />}>
            Close
          </Button>
          {mode === 'create' && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSave}
              disabled={!isFormValid}
              startIcon={<Save />}
            >
              Save Syllabus
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={mode === 'view' && syllabus ? downloadBackendPDF : generatePDF}
            disabled={!isFormValid}
            startIcon={<PictureAsPdf />}
          >
            Download PDF
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Form Fields */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Course Information
            </Typography>
            <TextField
              fullWidth
              label="Course Title"
              value={templateData.courseTitle}
              onChange={(e) => handleInputChange('courseTitle', e.target.value)}
              margin="normal"
              required
              disabled={mode === 'create' && selectedSubject}
            />
            <TextField
              fullWidth
              label="Course Code"
              value={templateData.courseCode}
              onChange={(e) => handleInputChange('courseCode', e.target.value)}
              margin="normal"
              required
              disabled={mode === 'create' && selectedSubject}
            />
            <TextField
              fullWidth
              label="Instructor Name"
              value={templateData.instructor}
              margin="normal"
              disabled
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={templateData.email}
              margin="normal"
              disabled
            />
            <TextField
              fullWidth
              label="Office Hours"
              value={templateData.officeHours}
              onChange={(e) => handleInputChange('officeHours', e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Subject Typology</InputLabel>
              <Select
                value={templateData.typology}
                label="Subject Typology"
                onChange={(e) => handleInputChange('typology', e.target.value)}
              >
                <MenuItem value="A">A - Basic</MenuItem>
                <MenuItem value="B">B - Intermediate</MenuItem>
                <MenuItem value="C">C - Advanced</MenuItem>
                <MenuItem value="D">D - Specialized</MenuItem>
                <MenuItem value="E">E - Research</MenuItem>
                <MenuItem value="F">F - Practical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Subject Type</InputLabel>
              <Select
                value={templateData.type}
                label="Subject Type"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <MenuItem value="compulsory">Compulsory</MenuItem>
                <MenuItem value="optional">Optional</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Paper
            sx={{
              p: 3,
              mt: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Course Details
            </Typography>
            <TextField
              fullWidth
              label="Year"
              value={templateData.year || ''}
              onChange={(e) => handleInputChange('year', e.target.value)}
              margin="normal"
              placeholder="e.g., 2024"
            />
            <TextField
              fullWidth
              label="Semester"
              value={templateData.semester || ''}
              onChange={(e) => handleInputChange('semester', e.target.value)}
              margin="normal"
              placeholder="e.g., Fall"
            />
            <TextField
              fullWidth
              label="Course Description"
              value={templateData.additionalDescription || ''}
              onChange={(e) => handleInputChange('additionalDescription', e.target.value)}
              margin="normal"
              multiline
              rows={2}
              placeholder="Additional course description details"
            />
            <TextField
              fullWidth
              label="Learning Objectives"
              value={templateData.learningObjectives}
              onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Prerequisites"
              value={templateData.prerequisites}
              onChange={(e) => handleInputChange('prerequisites', e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Paper>
        </Grid>

        {/* Template Preview - Keep white background for PDF generation */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: 'fit-content',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Preview
            </Typography>
            <Box
              ref={templateRef}
              sx={{
                p: 3,
                bgcolor: '#ffffff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                fontFamily: 'Arial, sans-serif',
                color: '#333',
                maxWidth: '600px',
                margin: '0 auto',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
              }}
            >
              {/* Header - Always use print-friendly colors */}
              <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #1565C0', pb: 2 }}>
                <Typography variant="h4" sx={{ color: '#1565C0', fontWeight: 'bold', mb: 1 }}>
                  {templateData.courseTitle || 'Course Title'}
                </Typography>
                <Typography variant="h6" sx={{ color: '#666' }}>
                  {templateData.courseCode || 'Course Code'}
                </Typography>
              </Box>

              {/* Instructor Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  Instructor Information
                </Typography>
                <Typography sx={{ color: '#333' }}>
                  <strong>Name:</strong> {templateData.instructor || 'Instructor Name'}
                </Typography>
                <Typography sx={{ color: '#333' }}>
                  <strong>Email:</strong> {templateData.email || 'instructor@university.edu'}
                </Typography>
                {templateData.officeHours && (
                  <Typography sx={{ color: '#333' }}>
                    <strong>Office Hours:</strong> {templateData.officeHours}
                  </Typography>
                )}
              </Box>

              {/* Subject Information */}
              {(templateData.typology || templateData.type) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    Subject Information
                  </Typography>
                  {templateData.typology && (
                    <Typography sx={{ color: '#333' }}>
                      <strong>Typology:</strong> {templateData.typology} - {
                        templateData.typology === 'A' ? 'Basic' :
                        templateData.typology === 'B' ? 'Intermediate' :
                        templateData.typology === 'C' ? 'Advanced' :
                        templateData.typology === 'D' ? 'Specialized' :
                        templateData.typology === 'E' ? 'Research' :
                        templateData.typology === 'F' ? 'Practical' : ''
                      }
                    </Typography>
                  )}
                  {templateData.type && (
                    <Typography sx={{ color: '#333' }}>
                      <strong>Type:</strong> {templateData.type === 'compulsory' ? 'Compulsory' : 'Optional'}
                    </Typography>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Course Description */}
              {(templateData.year || templateData.semester || templateData.additionalDescription) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    Course Description
                  </Typography>
                  <Typography sx={{ lineHeight: 1.6, color: '#333' }}>
                    Year {templateData.year || '...'} Semester {templateData.semester || '...'} 15 weeks {templateData.additionalDescription || '.........'}
                  </Typography>
                </Box>
              )}

              {/* Learning Objectives */}
              {templateData.learningObjectives && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    Learning Objectives
                  </Typography>
                  <Typography sx={{ lineHeight: 1.6, color: '#333' }}>
                    {templateData.learningObjectives}
                  </Typography>
                </Box>
              )}

              {/* Prerequisites */}
              {templateData.prerequisites && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    Prerequisites
                  </Typography>
                  <Typography sx={{ color: '#333' }}>{templateData.prerequisites}</Typography>
                </Box>
              )}

              {/* Required Materials */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  Required Materials
                </Typography>
                <Typography sx={{ lineHeight: 1.6, color: '#333' }}>
                  {templateData.textbooks || 'Textbooks and materials will be announced.'}
                </Typography>
              </Box>

              {/* Grading Policy */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  Grading Policy
                </Typography>
                <Typography sx={{ lineHeight: 1.6, color: '#333' }}>
                  {templateData.assignmentsPercent && `Assignments: ${templateData.assignmentsPercent}%`}
                  {templateData.midtermPercent && `, Midterm: ${templateData.midtermPercent}%`}
                  {templateData.finalPercent && `, Final Exam: ${templateData.finalPercent}%`}
                  {templateData.otherPercent && `, Other: ${templateData.otherPercent}%`}
                  {(!templateData.assignmentsPercent && !templateData.midtermPercent && !templateData.finalPercent && !templateData.otherPercent) && 'Assignments: 40%, Midterm: 30%, Final Exam: 30%'}
                </Typography>
              </Box>

              {/* Policies */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  Course Policies
                </Typography>

                {templateData.attendancePolicy && (
                  <Typography sx={{ mb: 1, color: '#333' }}>
                    <strong>Attendance:</strong> {templateData.attendancePolicy}
                  </Typography>
                )}

                {templateData.academicIntegrity && (
                  <Typography sx={{ mb: 1, color: '#333' }}>
                    <strong>Academic Integrity:</strong> {templateData.academicIntegrity}
                  </Typography>
                )}
              </Box>

              {/* Schedule */}
              {templateData.schedule && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    Course Schedule
                  </Typography>
                  <Typography sx={{ lineHeight: 1.6, whiteSpace: 'pre-line', color: '#333' }}>
                    {templateData.schedule}
                  </Typography>
                </Box>
              )}

              {/* Footer */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  This syllabus is subject to change at the instructor's discretion.
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Last updated: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Additional Fields */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Required Textbooks/Materials"
                  value={templateData.textbooks}
                  onChange={(e) => handleInputChange('textbooks', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Grading Policy (Percentages)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Assignments (%)"
                      type="number"
                      value={templateData.assignmentsPercent || ''}
                      onChange={(e) => handleInputChange('assignmentsPercent', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Midterm (%)"
                      type="number"
                      value={templateData.midtermPercent || ''}
                      onChange={(e) => handleInputChange('midtermPercent', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Final Exam (%)"
                      type="number"
                      value={templateData.finalPercent || ''}
                      onChange={(e) => handleInputChange('finalPercent', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Other (%)"
                      type="number"
                      value={templateData.otherPercent || ''}
                      onChange={(e) => handleInputChange('otherPercent', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      helperText="Participation, quizzes, etc."
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Attendance Policy"
                  value={templateData.attendancePolicy}
                  onChange={(e) => handleInputChange('attendancePolicy', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Academic Integrity Policy"
                  value={templateData.academicIntegrity}
                  onChange={(e) => handleInputChange('academicIntegrity', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Course Schedule/Important Dates"
                  value={templateData.schedule}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Week 1: Introduction&#10;Week 2: Basic Concepts&#10;etc."
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SyllabusTemplate;
