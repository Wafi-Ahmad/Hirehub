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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { quizService } from '../../services/quizService';

const ApplicantTable = ({ jobId }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openCVDialog, setOpenCVDialog] = useState(false);
    const [selectedCV, setSelectedCV] = useState(null);
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
        
        const fullUrl = cvUrl.startsWith('http') ? cvUrl : `${process.env.REACT_APP_API_URL}${cvUrl}`;
        
        if (action === 'view') {
            setSelectedCV(fullUrl);
            setOpenCVDialog(true);
        } else if (action === 'download') {
            window.open(fullUrl, '_blank');
        }
    };

    const handleCloseCVDialog = () => {
        setOpenCVDialog(false);
        setSelectedCV(null);
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

    if (!applicants.length) {
        return (
            <Alert severity="info">
                No applicants have applied for this position yet.
            </Alert>
        );
    }

    return (
        <>
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
                                                src={applicant.profile_picture ? `${process.env.REACT_APP_API_URL}${applicant.profile_picture}` : undefined}
                                                alt={applicant.full_name}
                                            >
                                                {!applicant.profile_picture && <PersonIcon />}
                                            </Avatar>
                                            <Link
                                                component="button"
                                                variant="body1"
                                                onClick={() => handleProfileClick(applicant.user_id)}
                                                underline="hover"
                                            >
                                                {applicant.full_name}
                                            </Link>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{applicant.email}</TableCell>
                                    <TableCell align="center">
                                        <Typography
                                            color={applicant.quiz_score >= 70 ? 'success.main' : 'error.main'}
                                            fontWeight="bold"
                                        >
                                            {applicant.quiz_score}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography
                                            color={applicant.match_score >= 70 ? 'success.main' : 'warning.main'}
                                            fontWeight="bold"
                                        >
                                            {(applicant.match_score).toFixed(1)}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {applicant.cv_url && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="View CV">
                                                    <IconButton onClick={() => handleCVClick(applicant.cv_url, 'view')}>
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download CV">
                                                    <IconButton onClick={() => handleCVClick(applicant.cv_url, 'download')}>
                                                        <DescriptionIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {new Date(applicant.applied_date).toLocaleDateString()}
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

            <Dialog
                open={openCVDialog}
                onClose={handleCloseCVDialog}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>CV Preview</DialogTitle>
                <DialogContent>
                    <iframe
                        src={selectedCV}
                        style={{ width: '100%', height: '80vh', border: 'none' }}
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
        </>
    );
};

export default ApplicantTable;
