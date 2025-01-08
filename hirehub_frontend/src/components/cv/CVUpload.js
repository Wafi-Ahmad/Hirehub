import React, { useState } from 'react';
import {
    Button,
    Box,
    Typography,
    CircularProgress,
    Paper,
    Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { quizService } from '../../services/quizService';
import { toast } from 'react-hot-toast';

const CVUpload = ({ onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            const fileType = file.type;
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            if (!validTypes.includes(fileType)) {
                toast.error('Please upload a PDF or Word document');
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should not exceed 5MB');
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setUploading(true);
        try {
            await quizService.uploadCV(selectedFile);
            toast.success('CV uploaded successfully! We will review your application and contact you soon.');
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to upload CV');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Upload Your CV
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                Congratulations on passing the quiz! Please upload your CV to complete your application.
                We accept PDF and Word documents (max 5MB).
            </Alert>

            <Box
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    mb: 3,
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                    },
                }}
                onClick={() => document.getElementById('cv-upload').click()}
            >
                <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                    Click to select or drag and drop your CV
                </Typography>
                {selectedFile && (
                    <Typography variant="body2" color="primary">
                        Selected: {selectedFile.name}
                    </Typography>
                )}
            </Box>

            <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
            >
                {uploading ? 'Uploading...' : 'Upload CV'}
            </Button>
        </Paper>
    );
};

export default CVUpload;
