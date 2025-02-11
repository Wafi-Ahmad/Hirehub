import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Alert } from "@mui/material";
import "./_Quiz.css";

function QuizUI({ questions = [], onSubmit, disabled, previousAttempt, jobId }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [leaveCount, setLeaveCount] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showingResult, setShowingResult] = useState(false);
  const [answerOrder, setAnswerOrder] = useState({});
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeLeft, setBanTimeLeft] = useState(null);

  const navigate = useNavigate();

  // Check for existing ban on component mount
  useEffect(() => {
    const banKey = `quizBan_${jobId}`;
    const banInfo = localStorage.getItem(banKey);
    if (banInfo) {
      const { timestamp, attempts } = JSON.parse(banInfo);
      const now = new Date().getTime();
      const banEndTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
      
      if (now < banEndTime) {
        setIsBanned(true);
        const timeLeft = Math.ceil((banEndTime - now) / (1000 * 60 * 60)); // Convert to hours
        setBanTimeLeft(timeLeft);
      } else {
        // Ban period is over, clear the ban
        localStorage.removeItem(banKey);
      }
    }
  }, [jobId]);

  // Initialize random order for answers
  useEffect(() => {
    if (questions.length > 0) {
      const newAnswerOrder = {};
      questions.forEach((question, index) => {
        const order = Array.from({ length: 4 }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        const questionId = question.id ?? index;
        newAnswerOrder[questionId] = order;
      });
      setAnswerOrder(newAnswerOrder);
    }
  }, [questions]);

  useEffect(() => {
    if (previousAttempt) {
      setShowingResult(true);
    }
  }, [previousAttempt]);

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setTimeLeft(45);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      onSubmit(answers);
    }
  }, [currentQuestionIndex, questions.length, answers, onSubmit]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prevTime) => prevTime - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleNextQuestion();
    }
  }, [timeLeft, handleNextQuestion]);

  const handleVisibilityChange = useCallback(() => {
    // Don't track visibility changes if user is already banned
    if (document.hidden && !isBanned) {
      setLeaveCount((prevCount) => {
        const newCount = prevCount + 1;

        if (newCount >= 3) {
          // Set ban in localStorage with job-specific key
          const banKey = `quizBan_${jobId}`;
          const banInfo = {
            timestamp: new Date().getTime(),
            attempts: newCount
          };
          localStorage.setItem(banKey, JSON.stringify(banInfo));
          setIsBanned(true);
          setBanTimeLeft(24);
          
          // Show formal message and navigate
          alert("Due to multiple attempts to leave the quiz, you have been temporarily restricted from accessing this job's quiz. Please try again after 24 hours.");
          navigate("/");
          return newCount;
        }

        alert("You left the quiz! Skipping to the next question.");
        handleNextQuestion();
        return newCount;
      });
    }
  }, [handleNextQuestion, navigate, isBanned, jobId]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const handleAnswer = (shuffledIndex) => {
    if (disabled) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id ?? currentQuestionIndex;
    const order = answerOrder[questionId];
    const originalIndex = order[shuffledIndex];
    
    const newAnswers = {
      ...answers,
      [questionId]: originalIndex
    };
    setAnswers(newAnswers);
    setSelectedAnswer(shuffledIndex);

    setTimeout(() => {
      if (currentQuestionIndex === questions.length - 1) {
        onSubmit(newAnswers);
      } else {
        handleNextQuestion();
      }
    }, 1000);
  };

  // If user is banned, show ban message
  if (isBanned) {
    return (
      <Box className="quiz-container" sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="h6" component="div" gutterBottom>
            Quiz Access Restricted
          </Typography>
          <Typography>
            Due to multiple attempts to leave the quiz, your access has been temporarily restricted. 
            Please try again in {banTimeLeft} {banTimeLeft === 1 ? 'hour' : 'hours'}.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Rest of your existing render logic
  if (showingResult && previousAttempt) {
    return (
      <div className="quiz-container">
        <h2 className="quiz-title">Previous Attempt Result</h2>
        <div className="quiz-result">
          <p><strong>Score:</strong> {previousAttempt.score}%</p>
          <p><strong>Status:</strong> {previousAttempt.passed ? 'Passed' : 'Failed'}</p>
          <p><strong>Completed:</strong> {new Date(previousAttempt.completed_at).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  if (!questions.length || Object.keys(answerOrder).length === 0) {
    return <div className="quiz-container"><p>No questions available.</p></div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOrder = answerOrder[currentQuestion.id ?? currentQuestionIndex] || [];

  return (
    <div className="quiz-container">
      <div className="progress-bar">
        <span
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
          }}
        ></span>
      </div>
      <div className="quiz-content">
        <div className="quiz-header">
          <p className="question-counter">
            Question {currentQuestionIndex + 1}/{questions.length}
          </p>
          <p className="quiz-timer">
            <strong>Time Left: {timeLeft}s</strong>
          </p>
        </div>
        <h3 className="question-text">{currentQuestion.question}</h3>
        <ul className="quiz-options">
          {currentOrder.map((originalIndex, shuffledIndex) => (
            <li
              key={shuffledIndex}
              onClick={() => handleAnswer(shuffledIndex)}
              className={`quiz-option ${
                selectedAnswer === shuffledIndex ? "selected" : ""
              } ${disabled || selectedAnswer !== null ? 'disabled' : ''}`}
            >
              <div className="option-label">
                {String.fromCharCode(65 + shuffledIndex)}
              </div>
              <div className="option-text">{currentQuestion.answers[originalIndex]}</div>
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

export default QuizUI;