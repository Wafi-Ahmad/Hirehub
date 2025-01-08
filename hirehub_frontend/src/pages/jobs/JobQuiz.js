import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import QuizUI from '../../components/quiz/_QuizUI';
import { quizService } from '../../services/quizService';
import { toast } from 'react-toastify';
import CVUpload from '../../components/cv/CVUpload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PASS_THRESHOLD = 70; // 70% is passing score

const JobQuiz = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [quizResult, setQuizResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previousAttempt, setPreviousAttempt] = useState(null);
    const [showCVUpload, setShowCVUpload] = useState(false);

    useEffect(() => {
        loadQuiz();
    }, [jobId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await quizService.getJobQuiz(jobId);
            if (data.message === "You have already attempted this quiz") {
                setPreviousAttempt(data.result);
                setError("You have already attempted this quiz");
            } else {
                setQuizData(data);
            }
        } catch (err) {
            console.error('Quiz load error:', err);
            setError(err.message || 'Failed to load quiz');
            if (err.message === "You have already attempted this quiz" && err.result) {
                setPreviousAttempt(err.result);
            }
            toast.error(err.message || 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (answers) => {
        try {
            setSubmitting(true);
            if (!quizData?.quiz_id) {
                throw new Error('Quiz ID not found');
            }

            // Convert answers object to use string keys
            const formattedAnswers = {};
            Object.entries(answers).forEach(([key, value]) => {
                formattedAnswers[key.toString()] = value;
            });

            const result = await quizService.submitQuiz(quizData.quiz_id, formattedAnswers);
            setQuizResult(result);
            setPreviousAttempt(result);
            if (result.score >= PASS_THRESHOLD) {
                setShowCVUpload(true);
            }
        } catch (err) {
            console.error('Quiz submission error:', err);
            toast.error(err.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuizResults = () => {
        const result = previousAttempt || quizResult;
        const score = result?.score || 0;
        const hasPassed = score >= PASS_THRESHOLD;

        return (
            <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Quiz Results
                </Typography>
                
                <Box sx={{ textAlign: 'center', my: 3 }}>
                    <Typography variant="h5" color={hasPassed ? "success.main" : "error.main"}>
                        Score: {score}%
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Correct Answers: {result?.correct_count} out of {result?.total_questions}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ my: 3 }}>
                    {hasPassed ? (
                        <>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Congratulations! You've successfully passed the quiz. You can now proceed with uploading your CV to complete your job application.
                            </Alert>
                            {!showCVUpload ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<CloudUploadIcon />}
                                    fullWidth
                                    onClick={() => setShowCVUpload(true)}
                                    sx={{ mb: 2 }}
                                >
                                    Upload Your CV
                                </Button>
                            ) : (
                                <CVUpload jobId={jobId} />
                            )}
                        </>
                    ) : (
                        <Alert severity="info">
                            Unfortunately, you didn't pass the quiz. You need a score of {PASS_THRESHOLD}% or higher to proceed. You can try again later.
                        </Alert>
                    )}
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/jobs/${jobId}`)}
                    fullWidth
                >
                    Back to Job
                </Button>
            </Paper>
        );
    };

    if (loading) {
        return (
            <Container sx={{ mt: 12, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 12 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="outlined"
                    onClick={() => navigate(`/jobs/${jobId}`)}
                    sx={{ mt: 2 }}
                >
                    Back to Job
                </Button>
            </Container>
        );
    }

    if (previousAttempt || quizResult) {
        return renderQuizResults();
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
            {quizData && (
                <QuizUI
                    questions={quizData.questions}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </Container>
    );
};

export default JobQuiz;