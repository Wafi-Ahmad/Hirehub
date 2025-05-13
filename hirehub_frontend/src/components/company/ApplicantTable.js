import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Typography,
    Box,
    IconButton,
    Link,
    Tooltip,
    CircularProgress,
    Alert,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Tabs,
    Tab,
    Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import { quizService } from '../../services/quizService';
import { jobService } from '../../services/jobService';
import { interviewService } from '../../services/interviewService';
import moment from 'moment';
import ScheduleInterviewDialog from './ScheduleInterviewDialog';
import InterviewManagement from './InterviewManagement';

import { toast } from 'react-toastify';

const ApplicantTable = ({ jobId }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openCVDialog, setOpenCVDialog] = useState(false);
    const [selectedCV, setSelectedCV] = useState(null);
    const [openInterviewDialog, setOpenInterviewDialog] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (jobId) {
            loadApplicants();
        }
    }, [jobId]);

    const loadApplicants = async () => {
        try {
            setLoading(true);
            const response = await quizService.getJobApplicants(jobId);
            setApplicants(response || []);
            setError(null);
        } catch (error) {
            console.error('Failed to load applicants:', error);
            setError('Failed to load applicants. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleProfileClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const handleCVClick = (cvUrl, action) => {
        if (!cvUrl) return;
        
        if (action === 'view') {
            setSelectedCV(cvUrl);
            setOpenCVDialog(true);
        } else if (action === 'download') {
            window.open(cvUrl, '_blank');
        }
    };

    const handleSendJobOffer = async (applicantId) => {
        try {
            await jobService.sendJobOffer(jobId, applicantId);
            toast.success('Job offer sent successfully');
        } catch (error) {
            console.error('Error sending job offer:', error);
            toast.error(error.response?.data?.message || 'Failed to send job offer');
        }
    };

    const handleCloseCVDialog = () => {
        setOpenCVDialog(false);
        setSelectedCV(null);
    };

    const handleScheduleInterview = (applicant) => {
        setSelectedApplicant(applicant);
        setOpenInterviewDialog(true);
    };

    const handleCloseInterviewDialog = () => {
        setOpenInterviewDialog(false);
        setSelectedApplicant(null);
    };

    const handleSubmitInterview = async (interviewData) => {
        setIsScheduling(true);
        try {
            await interviewService.scheduleInterview(jobId, selectedApplicant.id, interviewData);
            toast.success('Interview scheduled successfully');
            setOpenInterviewDialog(false);
            setTabValue(1);
        } catch (error) {
            console.error('Error scheduling interview:', error);
            toast.error(error.message || 'Failed to schedule interview');
        } finally {
            setIsScheduling(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

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

    if (!applicants.length && tabValue === 0) {
        return (
            <Alert severity="info">
                No applicants have applied for this position yet.
            </Alert>
        );
    }

    return (
        <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="applicant tabs">
                    <Tab label="Applicants" />
                    <Tab label="Interviews" />
                </Tabs>
            </Box>

            {tabValue === 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Applicant</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="center">Quiz Score</TableCell>
                            <TableCell align="center">Match Score</TableCell>
                            <TableCell align="center">CV</TableCell>
                            <TableCell align="center">Applied Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {applicants
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((applicant, index) => (
                                <TableRow key={applicant.id} hover>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                src={applicant.profile_picture}
                                                alt={applicant.full_name}
                                            >
                                                {!applicant.profile_picture && <PersonIcon />}
                                            </Avatar>
                                            <Link
                                                component="button"
                                                variant="body1"
                                                onClick={() => handleProfileClick(applicant.id)}
                                                underline="hover"
                                            >
                                                {applicant.full_name}
                                            </Link>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{applicant.email}</TableCell>
                                    <TableCell align="center">
                                        <Typography color={applicant.quiz_score >= 60 ? 'success.main' : 'error.main'}>
                                            {applicant.quiz_score}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography color={applicant.match_score >= 70 ? 'success.main' : 'warning.main'}>
                                            {Math.round(applicant.match_score)}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {applicant.cv_url ? (
                                            <Box>
                                                <Tooltip title="View CV">
                                                    <IconButton onClick={() => handleCVClick(applicant.cv_url, 'view')} size="small">
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download CV">
                                                    <IconButton onClick={() => handleCVClick(applicant.cv_url, 'download')} size="small">
                                                        <DescriptionIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No CV uploaded
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {moment(applicant.applied_at).format('MMM DD, YYYY')}
                                    </TableCell>
                                    <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<EmailIcon />}
                                            onClick={() => handleSendJobOffer(applicant.id)}
                                                    size="small"
                                        >
                                                    Send Offer
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    startIcon={<EventIcon />}
                                                    onClick={() => handleScheduleInterview(applicant)}
                                                    size="small"
                                                >
                                                    Schedule Interview
                                        </Button>
                                            </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={applicants.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            ) : (
                <InterviewManagement jobId={jobId} />
            )}

            <Dialog
                open={openCVDialog}
                onClose={handleCloseCVDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>CV Preview</DialogTitle>
                <DialogContent>
                    <iframe
                        src={selectedCV}
                        style={{ width: '100%', height: '70vh', border: 'none' }}
                        title="CV Preview"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCVDialog}>Close</Button>
                    <Button onClick={() => window.open(selectedCV, '_blank')} color="primary">
                        Open in New Tab
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Schedule Interview Dialog */}
            <ScheduleInterviewDialog
                open={openInterviewDialog}
                onClose={handleCloseInterviewDialog}
                onSchedule={handleSubmitInterview}
                applicant={selectedApplicant}
                isScheduling={isScheduling}
            />
        </>
    );
};

export default ApplicantTable;
