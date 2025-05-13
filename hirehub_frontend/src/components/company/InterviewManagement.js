import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import { interviewService } from '../../services/interviewService';
import moment from 'moment';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const InterviewManagement = ({ jobId }) => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (jobId) {
            loadInterviews();
        }
    }, [jobId]);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            const response = await interviewService.getJobInterviews(jobId);
            setInterviews(response || []);
            setError(null);
        } catch (error) {
            console.error('Failed to load interviews:', error);
            setError('Failed to load interviews. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'primary';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'rescheduled':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled':
                return <EventIcon fontSize="small" />;
            case 'completed':
                return <CheckCircleIcon fontSize="small" />;
            case 'cancelled':
                return <CancelIcon fontSize="small" />;
            case 'rescheduled':
                return <EventIcon fontSize="small" />;
            default:
                return null;
        }
    };

    const getPlatformIcon = (platform) => {
        return <VideocamIcon fontSize="small" />;
    };

    // Filter interviews based on tab
    const filteredInterviews = interviews.filter(interview => {
        if (tabValue === 0) return true; // All interviews
        if (tabValue === 1) return ['scheduled', 'rescheduled'].includes(interview.status); // Upcoming
        if (tabValue === 2) return interview.status === 'completed'; // Completed
        if (tabValue === 3) return interview.status === 'cancelled'; // Cancelled
        return true;
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Interview Management
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="interview tabs">
                    <Tab label="All Interviews" />
                    <Tab label="Upcoming" />
                    <Tab label="Completed" />
                    <Tab label="Cancelled" />
                </Tabs>
            </Box>

            {filteredInterviews.length === 0 ? (
                <Alert severity="info">No interviews found for this job.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Applicant</TableCell>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Platform</TableCell>
                                <TableCell>Interviewer</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInterviews.map((interview) => (
                                <TableRow key={interview.id} hover>
                                    <TableCell>{interview.applicant_name}</TableCell>
                                    <TableCell>
                                        {moment(interview.scheduled_date).format('MMM DD, YYYY [at] h:mm A')}
                                    </TableCell>
                                    <TableCell>{interview.duration_minutes} minutes</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getPlatformIcon(interview.platform)}
                                            <Typography variant="body2">
                                                {interview.platform === 'google_meet' ? 'Google Meet' : 
                                                 interview.platform === 'zoom' ? 'Zoom' : 
                                                 interview.platform}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{interview.interviewer_name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(interview.status)}
                                            label={interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                            color={getStatusColor(interview.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            href={interview.meeting_link}
                                            target="_blank"
                                            disabled={!interview.meeting_link || interview.status === 'cancelled'}
                                        >
                                            Join Meeting
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default InterviewManagement; 