import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import StarsIcon from '@mui/icons-material/Stars';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/apiConstants';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CVUploader = ({ onCVParsed }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Reset states
    setError(null);
    setSuccess(false);
    setParsedData(null);
    
    const selectedFile = acceptedFiles[0];
    
    // Validate file type
    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(fileType)) {
      setError('Please upload a PDF or Word document');
      return;
    }
    
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit');
      return;
    }
    
    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('cv_file', file);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/users/parse-cv/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSuccess(true);
      setUploadedFileName(file.name);
      
      // Store the parsed data
      if (response.data.parsed_info) {
        setParsedData(response.data.parsed_info);
        
        // Pass the parsed information to the parent component
        if (onCVParsed) {
          onCVParsed(response.data.parsed_info);
        }
      }
      
    } catch (error) {
      console.error('Error parsing CV:', error);
      setError(error.response?.data?.error || 'Failed to parse CV');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render skills as chips grouped by category
  const renderSkillsPreview = () => {
    if (!parsedData?.skills_structured?.categorized) {
      return null;
    }

    // Map of category names to more user-friendly labels
    const categoryLabels = {
      'programming': 'Programming Languages',
      'frameworks': 'Frameworks & Libraries',
      'databases': 'Databases',
      'tools': 'Tools & Platforms',
      'methodologies': 'Methodologies & Processes',
      'soft_skills': 'Soft Skills',
      'other': 'Other Skills'
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Skills
        </Typography>
        
        {Object.entries(parsedData.skills_structured.categorized).map(([category, skills]) => (
          skills.length > 0 && (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {categoryLabels[category] || category}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {skills.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )
        ))}
      </Box>
    );
  };

  // Helper function to render education information
  const renderEducationPreview = () => {
    const educationData = parsedData?.education_structured || [];
    
    if (!educationData.length) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Education
        </Typography>
        
        {educationData.map((edu, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              {edu.degree && edu.field_of_study && (
                <Typography variant="subtitle2" fontWeight="bold">
                  {edu.degree} in {edu.field_of_study}
                </Typography>
              )}
              
              {edu.institution && (
                <Typography variant="body2">
                  {edu.institution}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {edu.start_date && edu.end_date ? 
                  `${edu.start_date} - ${edu.end_date}` : 
                  edu.year ? edu.year : 
                  edu.expected_graduation ? `Expected graduation: ${edu.expected_graduation}` : ''}
              </Typography>
              
              {edu.gpa && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  GPA: {edu.gpa}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Helper function to render experience information
  const renderExperiencePreview = () => {
    const experienceData = parsedData?.experience_structured || [];
    
    if (!experienceData.length) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Experience
        </Typography>
        
        {experienceData.map((exp, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              {exp.title && (
                <Typography variant="subtitle2" fontWeight="bold">
                  {exp.title}
                </Typography>
              )}
              
              {exp.company && (
                <Typography variant="body2">
                  {exp.company} {exp.location ? `(${exp.location})` : ''}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : ''}
              </Typography>
              
              {exp.responsibilities && exp.responsibilities.length > 0 && (
                <>
                  <Typography variant="body2" fontWeight="medium">
                    Responsibilities:
                  </Typography>
                  <List dense disablePadding>
                    {exp.responsibilities.slice(0, 3).map((resp, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={<Typography variant="body2">• {resp}</Typography>}
                        />
                      </ListItem>
                    ))}
                    {exp.responsibilities.length > 3 && (
                      <ListItem sx={{ py: 0 }}>
                        <ListItemText 
                          primary={<Typography variant="body2">• ...and {exp.responsibilities.length - 3} more</Typography>}
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}
              
              {exp.technologies && exp.technologies.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Technologies:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {exp.technologies.map((tech, techIdx) => (
                      <Chip 
                        key={techIdx} 
                        label={tech} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Helper function to render current work
  const renderCurrentWorkPreview = () => {
    const currentWork = parsedData?.current_work_structured;
    
    if (!currentWork || Object.keys(currentWork).length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Current Position
        </Typography>
        
        <Card variant="outlined">
          <CardContent>
            {currentWork.title && (
              <Typography variant="subtitle2" fontWeight="bold">
                {currentWork.title}
              </Typography>
            )}
            
            {currentWork.company && (
              <Typography variant="body2">
                {currentWork.company} {currentWork.location ? `(${currentWork.location})` : ''}
              </Typography>
            )}
            
            <Typography variant="body2" color="text.secondary">
              {currentWork.start_date ? `Since ${currentWork.start_date}` : ''}
            </Typography>
            
            {currentWork.responsibilities && currentWork.responsibilities.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Key Responsibilities:
                </Typography>
                <Typography variant="body2">
                  {currentWork.responsibilities[0]}
                  {currentWork.responsibilities.length > 1 && '...'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Helper function to render certifications
  const renderCertificationsPreview = () => {
    const certifications = parsedData?.certifications_structured || [];
    
    if (!certifications.length) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Certifications
        </Typography>
        
        <List dense disablePadding>
          {certifications.map((cert, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <StarsIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={cert.name}
                secondary={
                  <React.Fragment>
                    {cert.organization && `${cert.organization}`}
                    {cert.date && cert.organization && ` - `}
                    {cert.date && `${cert.date}`}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Render personal information
  const renderPersonalInfoPreview = () => {
    const personalInfo = parsedData?.personal_info || {};
    
    if (!personalInfo || Object.keys(personalInfo).length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Personal Information
        </Typography>
        
        <List dense disablePadding>
          {personalInfo.first_name && personalInfo.last_name && (
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={`${personalInfo.first_name} ${personalInfo.last_name}`} />
            </ListItem>
          )}
          
          {personalInfo.email && (
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>@</Typography>
              </ListItemIcon>
              <ListItemText primary={personalInfo.email} />
            </ListItem>
          )}
          
          {personalInfo.phone && (
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>☎</Typography>
              </ListItemIcon>
              <ListItemText primary={personalInfo.phone} />
            </ListItem>
          )}
          
          {personalInfo.location && (
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>📍</Typography>
              </ListItemIcon>
              <ListItemText primary={personalInfo.location} />
            </ListItem>
          )}
        </List>
      </Box>
    );
  };

  // Combined preview of parsed data
  const renderParsedDataPreview = () => {
    if (!parsedData) return null;
    
    return (
      <>
        {renderPersonalInfoPreview()}
        
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography>Skills</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderSkillsPreview()}
          </AccordionDetails>
        </Accordion>
        
        <Accordion defaultExpanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WorkIcon sx={{ mr: 1 }} />
              <Typography>Experience</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderCurrentWorkPreview()}
            {renderExperiencePreview()}
          </AccordionDetails>
        </Accordion>
        
        <Accordion defaultExpanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 1 }} />
              <Typography>Education</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderEducationPreview()}
          </AccordionDetails>
        </Accordion>
        
        <Accordion defaultExpanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StarsIcon sx={{ mr: 1 }} />
              <Typography>Certifications</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderCertificationsPreview()}
          </AccordionDetails>
        </Accordion>
      </>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Parsing your CV...
          </Typography>
        </Box>
      );
    }
    
    if (success) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert 
            icon={<CheckCircleIcon fontSize="inherit" />} 
            severity="success"
            sx={{ mb: 2 }}
          >
            CV successfully parsed!
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText 
                primary={uploadedFileName}
                secondary="Your profile information has been extracted"
              />
            </ListItem>
          </List>
          
          {renderParsedDataPreview()}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                setSuccess(false);
                setUploadedFileName(null);
                setParsedData(null);
              }}
            >
              Upload Another CV
            </Button>
          </Box>
        </Box>
      );
    }
    
    return (
      <Box sx={{ p: 3 }}>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Drag & drop your CV here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to select a file
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
            Supported formats: PDF, DOC, DOCX (Max size: 5MB)
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            icon={<ErrorIcon fontSize="inherit" />}
          >
            {error}
          </Alert>
        )}
        
        {file && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected file: {file.name}
            </Alert>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleParse}
              startIcon={<DescriptionIcon />}
            >
              Parse CV & Auto-Fill Profile
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        maxWidth: '100%', 
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
        <Typography variant="h6">
          Upload & Parse CV
        </Typography>
        <Typography variant="body2">
          Upload your CV to automatically fill your profile information
        </Typography>
      </Box>
      <Divider />
      {renderContent()}
    </Paper>
  );
};

export default CVUploader; 