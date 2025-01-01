import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import QuizUI from '../../components/quiz/_QuizUI';
import { quizService } from '../../services/quizService';
import { toast } from 'react-toastify';

const JobQuiz = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [quizResult, setQuizResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previousAttempt, setPreviousAttempt] = useState(null);

    useEffect(() => {
        loadQuiz();
    }, [jobId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("jobId", jobId);
            const data = await quizService.getJobQuiz(jobId);
            console.log("data", data);
            setQuizData(data);
            console.log("quizData", data);
        } catch (err) {
            // Check if this is a previous attempt error (status 400)
            console.log("err", err);
            console.log("err.result", err.result);
            // console.log("err.response.data", err.response.data);
            // console.log("err.response.data.message", err.response.data.message);
            console.log("err.message", err.message);
            if (err?.message === "You have already attempted this quiz") {
                setPreviousAttempt(err.result);
                console.log("previousAttempt", err.result);
            } else {
                setError(err.response?.data?.message || err.error || 'Failed to load quiz');
                toast.error(err.response?.data?.message || err.error || 'Failed to load quiz');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (answers) => {
        try {
            setSubmitting(true);
            const result = await quizService.submitQuiz(quizData.quiz_id, answers);
            setQuizResult(result);
            
            if (result.passed) {
                toast.success('Congratulations! You passed the quiz!');
            } else {
                toast.info('Unfortunately, you did not pass the quiz. You can try again later.');
            }
        } catch (err) {
            toast.error(err.error || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(`/jobs/${jobId}`);
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (previousAttempt) {
        return (
            <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Previous Quiz Attempt
                    </Typography>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        You have already attempted this quiz
                    </Alert>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" color={previousAttempt.passed ? "success.main" : "error.main"} gutterBottom>
                            Score: {previousAttempt.score}%
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Status: {previousAttempt.passed ? 'Passed' : 'Failed'}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Completed: {new Date(previousAttempt.completed_at).toLocaleString()}
                        </Typography>
                    </Box>
                    <Button variant="contained" onClick={handleBack}>
                        Back to Job
                    </Button>
                </Paper>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="outlined" onClick={handleBack}>
                    Back to Job
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {!quizResult ? (
                    <>
                        <Typography variant="h4" gutterBottom>
                            Job Application Quiz
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Please complete this quiz to proceed with your job application.
                            Passing score: {quizData?.passing_score}%
                        </Typography>
                        
                        <QuizUI
                            questions={quizData?.questions || []}
                            onSubmit={handleSubmit}
                            disabled={submitting}
                        />
                    </>
                ) : (
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Quiz Results
                        </Typography>
                        <Typography variant="h5" color={quizResult.passed ? "success.main" : "error.main"} gutterBottom>
                            Score: {quizResult.score}%
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Correct Answers: {quizResult.correct_answers} out of {quizResult.total_questions}
                        </Typography>
                        
                        {quizResult.passed ? (
                            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                                Congratulations! You've passed the quiz and can proceed with your application.
                            </Alert>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                                Unfortunately, you didn't pass the quiz. You can try again later.
                            </Alert>
                        )}
                        
                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                onClick={handleBack}
                                sx={{ mr: 2 }}
                            >
                                Back to Job
                            </Button>
                            {quizResult.passed && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {/* Handle application submission */}}
                                >
                                    Continue Application
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default JobQuiz; 