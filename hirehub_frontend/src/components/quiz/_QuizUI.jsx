import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Alert, CircularProgress, Button } from "@mui/material";
import { jobService } from "../../services/jobService";
import CVUpload from '../cv/CVUpload';
import "./_Quiz.css";

// Define target length (should ideally match backend)
const TARGET_QUIZ_LENGTH = 10;

function QuizUI({ jobId }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [quizStatus, setQuizStatus] = useState('loading');
  const [quizResult, setQuizResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [leaveCount, setLeaveCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeLeft, setBanTimeLeft] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const banKey = `quizBan_${jobId}`;
    const banInfo = localStorage.getItem(banKey);
    if (banInfo) {
      const { timestamp } = JSON.parse(banInfo);
      const now = new Date().getTime();
      const banEndTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours
      
      if (now < banEndTime) {
        setIsBanned(true);
        const timeLeftHrs = Math.ceil((banEndTime - now) / (1000 * 60 * 60));
        setBanTimeLeft(timeLeftHrs);
        setQuizStatus('banned');
      } else {
        localStorage.removeItem(banKey);
      }
    }
  }, [jobId]);

  const startQuiz = useCallback(async () => {
    if (!jobId || isBanned) return;
    setQuizStatus('loading');
    setErrorMessage('');
    try {
      const response = await jobService.startQuiz(jobId);
      if (response.status === 'in_progress' && response.question) {
        setCurrentQuestion(response.question);
        setQuestionsAnsweredCount(0);
        setSelectedAnswerIndex(null);
        setTimeLeft(45);
        setQuizStatus('in_progress');
      } else if (response.status === 'finished') {
        setQuizResult(response);
        setQuizStatus('finished');
      } else {
        throw new Error(response.message || 'Unexpected response when starting quiz.');
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      setErrorMessage(error.message || "Failed to start quiz. Please try again.");
      setQuizStatus('error');
    }
  }, [jobId, isBanned]);

  useEffect(() => {
    if (!isBanned) {
      startQuiz();
    }
  }, [startQuiz, isBanned]);

  const submitAnswer = useCallback(async (answerIndex) => {
    if (!currentQuestion || selectedAnswerIndex !== null) return;

    setQuizStatus('loading');
    setErrorMessage('');
    setSelectedAnswerIndex(answerIndex);
    
    const answerData = {
      question_ref: currentQuestion.ref,
      answer_index: answerIndex,
    };

    try {
      const response = await jobService.submitQuizAnswer(jobId, answerData);

      setTimeout(() => {
         if (response.status === 'in_progress' && response.question) {
           setCurrentQuestion(response.question);
           setQuestionsAnsweredCount(prev => prev + 1);
           setSelectedAnswerIndex(null);
           setTimeLeft(45);
           setQuizStatus('in_progress');
         } else if (response.status === 'finished') {
           setQuizResult(response);
           setQuizStatus('finished');
         } else {
            throw new Error(response.message || 'Unexpected response after submitting answer.');
         }
      }, 500);

    } catch (error) {
      console.error("Error submitting answer:", error);
      setErrorMessage(error.message || "Failed to submit answer. Please try again or refresh.");
      setQuizStatus('error'); 
    }
  }, [jobId, currentQuestion, selectedAnswerIndex]);

  useEffect(() => {
    if (quizStatus === 'in_progress' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prevTime) => prevTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizStatus === 'in_progress' && timeLeft === 0) {
      console.log("Time ran out, submitting skip.");
      submitAnswer(-1); 
    }
  }, [timeLeft, quizStatus, submitAnswer]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !isBanned && quizStatus === 'in_progress') {
      setLeaveCount((prevCount) => {
        const newCount = prevCount + 1;
        if (newCount >= 3) {
          const banKey = `quizBan_${jobId}`;
          const banInfo = { timestamp: new Date().getTime(), attempts: newCount };
          localStorage.setItem(banKey, JSON.stringify(banInfo));
          setIsBanned(true);
          setBanTimeLeft(24);
          setQuizStatus('banned');
          alert("Due to multiple attempts to leave the quiz... try again after 24 hours.");
          navigate("/");
          return newCount;
        }
        alert("You left the quiz! Skipping to the next question.");
        submitAnswer(-1);
        return newCount;
      });
    }
  }, [navigate, isBanned, jobId, quizStatus, submitAnswer]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  if (quizStatus === 'banned') {
    return (
      <Box className="quiz-container" sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}>
          <Typography variant="h6" component="div" gutterBottom>Quiz Access Restricted</Typography>
          <Typography>
            Access restricted. Try again in {banTimeLeft} {banTimeLeft === 1 ? 'hour' : 'hours'}.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (quizStatus === 'loading') {
    return (
      <Box className="quiz-container" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (quizStatus === 'error') {
    return (
      <Box className="quiz-container" sx={{ p: 3 }}>
        <Alert severity="error">{errorMessage || 'An error occurred.'}</Alert>
        <Button variant="contained" onClick={startQuiz} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  if (quizStatus === 'finished' && quizResult) {
    const hasPassed = quizResult.passed;
    return (
      <div className="quiz-container">
        <h2 className="quiz-title">Quiz Completed</h2>
        <div className="quiz-result" style={{ marginBottom: '20px' }}>
          {quizResult.message && <p>{quizResult.message}</p>} 
          <p><strong>Score:</strong> {quizResult.score}%</p>
          <p><strong>Status:</strong> {hasPassed ? 'Passed' : 'Failed'}</p>
          {quizResult.correct_answers !== undefined && (
             <p>Correct Answers: {quizResult.correct_answers} / {quizResult.total_questions || TARGET_QUIZ_LENGTH}</p>
          )}
        </div>

        {hasPassed ? (
          <CVUpload 
            onSuccess={() => {
              console.log("CV Upload successful, navigating home.");
              navigate('/');
            }}
          />
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
                Unfortunately, you did not meet the passing score for this quiz.
            </Alert>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                Go Home
            </Button>
          </>
        )}
      </div>
    );
  }

  if (quizStatus === 'in_progress' && currentQuestion) {
    const progress = Math.min(100, (questionsAnsweredCount / TARGET_QUIZ_LENGTH) * 100);
    return (
      <div className="quiz-container">
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }}></span>
        </div>
        <div className="quiz-content">
          <div className="quiz-header">
            <p className="question-counter">
              Question {questionsAnsweredCount + 1}/{TARGET_QUIZ_LENGTH}
            </p>
            <p className="quiz-timer">
              <strong>Time Left: {timeLeft}s</strong>
            </p>
          </div>
          <h3 className="question-text">{currentQuestion.text}</h3>
          <ul className="quiz-options">
            {currentQuestion.options.map((optionText, index) => (
              <li
                key={index} 
                onClick={() => submitAnswer(index)}
                className={`quiz-option ${selectedAnswerIndex === index ? "selected" : ""} ${selectedAnswerIndex !== null ? 'disabled' : ''}`}
              >
                <div className="option-label">
                  {String.fromCharCode(65 + index)} 
                </div>
                <div className="option-text">{optionText}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="leave-count-warning">
          {leaveCount > 0 && leaveCount < 3 && (
            <p className="warning-text">
              Warning: You have left the quiz {leaveCount} time(s).
            </p>
          )}
        </div>
      </div>
    );
  }

  return <div className="quiz-container"><p>Loading quiz...</p></div>;
}

export default QuizUI;