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
import {useSnackbar} from "../services/SnacbarService";

const SyllabusTemplate = ({ syllabus, onClose, onSave, mode = 'view', selectedSubject = null }) => {
  const theme = useTheme();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { show } = useSnackbar();

  const downloadBackendPDF = async () => {
    if (!syllabus) return;

    try {
    const response = await api.post(`/syllabi/${syllabus.id}/pdf`,
      { template_data: templateData },
      { responseType: 'blob' }
    );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = templateData.courseTitle + '_' + templateData.language;
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
      show('Error downloading PDF. Please try again.', 'error');
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
    language: 'AL',
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
    assignmentsPercent : '',
    midtermPercent : '',
    finalPercent : '',
    otherPercent : '',
    credits: '',
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
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, options = {}) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y, options);
      return lines.length * 5; // Return height used
    };

    // Helper function for table cell
    const drawCell = (x, y, width, height, text, isBold = false) => {
      pdf.rect(x, y, width, height);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(text, width - 4);
      pdf.text(lines, x + 2, y + 5);
    };

    // === PAGE 1: HEADER AND COURSE INFO TABLE ===

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('MASTER SHKENCOR NË "DATA SCIENCE AND ARTIFICIAL INTELLIGENCE"', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    pdf.setFontSize(12);
    pdf.text('PROGRAMI I LËNDËS:', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Course Information Table
    const tableStartX = margin;
    const colWidths = [50, 30, 30, 30, 30]; // Adjust as needed
    const rowHeight = 10;

    // Table Header
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    drawCell(tableStartX, yPos, colWidths[0], rowHeight, 'Aktiviteti mësimor', true);
    drawCell(tableStartX + colWidths[0], yPos, colWidths[1], rowHeight, 'Leksione', true);
    drawCell(tableStartX + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight, 'Ushtrime', true);
    drawCell(tableStartX + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], rowHeight, 'Laboratore', true);
    drawCell(tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos, colWidths[4], rowHeight, 'Totale', true);
    yPos += rowHeight;

    // Table Rows
    const tableData = [
      ['Detyrimi i studentit', 'Jo të detyrueshëm', '75%', '100%', '100%'],
      ['Orë mesimore', '', '', '', ''],
      ['Studim individuale', '', '', '', ''],
      ['Gjuha e zhvillimit të mësimit', 'Anglisht', '', '', ''],
      [`Tipologjia e lëndës / Lloji i lëndës/ Kodi i lëndës`, `${templateData.typology || 'B'} / ${templateData.type === 'compulsory' ? 'E detyrueshme' : 'Zgjedhore'} / ${templateData.courseCode || ''}`, '', '', ''],
      ['Kodi i etikës', 'Referuar Kodit të etikës së UT, miratuar me Vendim Nr. 12, datë 18.04.2011', '', '', ''],
      ['Mënyra e shlyerjes', 'Provim', '', '', ''],
      ['Kredite', '6', '', '', ''],
      [`Zhvillimi i Mësimit`, `Viti ${templateData.year || 'I'}, Semestri ${templateData.semester || 'II'}, 15 javë: 2 orë leksione, 2 orë seminare, 2 orë laborator/javë`, '', '', ''],
      ['Zhvillimi i Provimit', 'Vetëm me shkrim, 45-50 pikë nota pesë, çdo dhjetë pikë vlerësimi shtohet me një notë.', '', '', '']
    ];

    pdf.setFont('helvetica', 'normal');
    tableData.forEach(row => {
      const cellHeight = rowHeight;
      drawCell(tableStartX, yPos, colWidths[0], cellHeight, row[0]);
      drawCell(tableStartX + colWidths[0], yPos, colWidths[1], cellHeight, row[1]);
      drawCell(tableStartX + colWidths[0] + colWidths[1], yPos, colWidths[2], cellHeight, row[2]);
      drawCell(tableStartX + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], cellHeight, row[3]);
      drawCell(tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos, colWidths[4], cellHeight, row[4]);
      yPos += cellHeight;
    });

    yPos += 10;

    // Grading Table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Vlerësimi, Nota, Provim', tableStartX, yPos);
    yPos += 7;

    const gradingItems = [
      'Pjesëmarrja dhe aktivizimi',
      'Kontrolle të ndërmjetme',
      'Detyra kursi',
      'Laboratore',
      'Praktika në terren',
      'Provimit final',
      'Gjithsej'
    ];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    gradingItems.forEach(item => {
      pdf.text(`• ${item}`, tableStartX + 5, yPos);
      yPos += 5;
    });

    yPos += 10;

    // === PAGE 2: COURSE CONTENT ===
    pdf.addPage();
    yPos = margin;

    // Course Concepts
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Konceptet themelore', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const conceptsHeight = addText(templateData.additionalDescription || '', margin, yPos, pageWidth - 2 * margin);
    yPos += conceptsHeight + 10;

    // Objectives
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Objektivat', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const objectivesHeight = addText(templateData.learningObjectives || '', margin, yPos, pageWidth - 2 * margin);
    yPos += objectivesHeight + 10;

    // Prerequisites
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Njohuritë paraprake', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const prereqHeight = addText(templateData.prerequisites || 'Nuk ka', margin, yPos, pageWidth - 2 * margin);
    yPos += prereqHeight + 10;

    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }

    // Skills
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Aftësitë me të cilat pajiset studenti', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const skillsText = 'Studentët do të zhvillojnë aftësi analitike dhe praktike në fushen e lëndës.';
    const skillsHeight = addText(skillsText, margin, yPos, pageWidth - 2 * margin);
    yPos += skillsHeight + 10;

    // Schedule/Syllabus
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Tematika e Leksioneve', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const scheduleHeight = addText(templateData.schedule || 'Do të njoftohet në fillim të semestrit', margin, yPos, pageWidth - 2 * margin);
    yPos += scheduleHeight + 10;

    // Literature
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Literatura', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Tekste bazë:', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    const litHeight = addText(templateData.textbooks || 'Do të njoftohet në fillim të semestrit', margin, yPos, pageWidth - 2 * margin);
    yPos += litHeight + 15;

    // Signatures
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Titullari i lëndës', margin, yPos);
    pdf.text('Përgjegjësi i Departamentit', pageWidth - margin - 60, yPos);
    yPos += 15;

    pdf.setFont('helvetica', 'normal');
    pdf.text(templateData.instructor || '', margin, yPos);
    pdf.text('Prof. Dr. [Emri]', pageWidth - margin - 60, yPos);

    // Save PDF
    pdf.save(`syllabus-${templateData.courseCode || 'template'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    show('Error generating PDF. Please try again.', 'error');
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
        p: { xs: 12, md: 3 },
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
             <InputLabel>Language</InputLabel>
              <Select
                value={templateData.language}
                label="Select language"
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <MenuItem value="AL">AL</MenuItem>
                <MenuItem value="EN">EN</MenuItem>
              </Select>
</FormControl>
        </Box>
      </Paper>

      <Grid container xs={12} md={6} spacing={3}>
        {/* Form Fields */}
        <Grid item size={6}>
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
       </Grid>
        <Grid item size={6}>
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
        <Grid item size={4}>
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
                  color: '#222',
                  maxWidth: '700px',
                  margin: '0 auto',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
              }}
            >
              {/* Header - Always use print-friendly colors */}
                <Box sx={{ position: 'relative', textAlign: 'center', mb: 3, pb: 2 }}>
                  <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: 10, background: 'linear-gradient(90deg,#1565C0,#42A5F5)', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
                  <Box sx={{ pt: 2 }} />
                  <Typography variant="h4" sx={{ color: '#0d47a1', fontWeight: 800, mb: 0.5, fontFamily: 'Georgia, serif' }}>
                    {templateData.courseTitle || 'Course Title'}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#546e7a', fontWeight: 600 }}>
                    {templateData.courseCode || 'Course Code'}
                  </Typography>
                  {/* code pill top-right */}
                  <Box sx={{ position: 'absolute', top: 14, right: 12 }}>
                    <Box sx={{ bgcolor: '#e3f2fd', color: '#0d47a1', px: 1.5, py: 0.4, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(13,71,161,0.08)' }}>
                      {templateData.courseCode || ''}
                    </Box>
                  </Box>
                </Box>

              {/* Instructor Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
                    Prerequisites
                  </Typography>
                  <Typography sx={{ color: '#333' }}>{templateData.prerequisites}</Typography>
                </Box>
              )}

              {/* Required Materials */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
                  Required Materials
                </Typography>
                <Typography sx={{ lineHeight: 1.6, color: '#333' }}>
                  {templateData.textbooks || 'Textbooks and materials will be announced.'}
                </Typography>
              </Box>

              {/* Grading Policy */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0d47a1', background: '#f3f7fb', display: 'inline-block', px: 1, borderRadius: 0.5 }}>
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
        <Grid item size={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
            Additional Information
          </Typography>

          <Grid container xs={12} md={6} spacing={3}>
            {/* Section 1: Textbooks & Materials */}
            <Grid item xs={12} md={6} size={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  Required Materials
                </Typography>
                <TextField
                  fullWidth
                  label="Required Textbooks/Materials"
                  value={templateData.textbooks}
                  onChange={(e) => handleInputChange('textbooks', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="List all required textbooks, materials, and resources..."
                />
              </Box>
            </Grid>

            {/* Section 2: Grading Policy */}
            <Grid item size={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  Grading Policy (Total should equal 100%)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item size={6}>
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
                  <Grid item size={6}>
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
                  <Grid item size={6}>
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
                  <Grid item size={6}>
                    <TextField
                      fullWidth
                      label="Other (%)"
                      type="number"
                      value={templateData.otherPercent || ''}
                      onChange={(e) => handleInputChange('otherPercent', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      placeholder="Participation, etc."
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Section 3: Course Policies */}
            <Grid item size={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                Course Policies
              </Typography>
            </Grid>

            <Grid item size={12}>
              <TextField
                fullWidth
                label="Attendance Policy"
                value={templateData.attendancePolicy}
                onChange={(e) => handleInputChange('attendancePolicy', e.target.value)}
                multiline
                rows={3}
                placeholder="Describe your attendance requirements and policies..."
              />
            </Grid>

            <Grid item size={12}>
              <TextField
                fullWidth
                label="Academic Integrity Policy"
                value={templateData.academicIntegrity}
                onChange={(e) => handleInputChange('academicIntegrity', e.target.value)}
                multiline
                rows={3}
                placeholder="Outline academic integrity expectations..."
              />
            </Grid>

            {/* Section 4: Course Schedule */}
            <Grid item item size={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  Course Schedule & Important Dates
                </Typography>
                <TextField
                  fullWidth
                  label="Course Schedule/Important Dates"
                  value={templateData.schedule}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                  multiline
                  rows={6}
                  placeholder="Week 1: Introduction&#10;Week 2: Basic Concepts&#10;Week 3: Advanced Topics&#10;etc."
                />
              </Box>
            </Grid>
          </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SyllabusTemplate;
