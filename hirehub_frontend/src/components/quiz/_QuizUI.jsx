import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./_Quiz.css";

function QuizUI({ questions = [], onSubmit, disabled, previousAttempt }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [leaveCount, setLeaveCount] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showingResult, setShowingResult] = useState(false);
  const [answerOrder, setAnswerOrder] = useState({});

  const navigate = useNavigate();

  // Initialize random order for answers
  useEffect(() => {
    if (questions.length > 0) {
      const newAnswerOrder = {};
      questions.forEach(question => {
        // Create array [0,1,2,3] and shuffle it
        const order = Array.from({ length: 4 }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        newAnswerOrder[question.id] = order;
        
        // Debug logs
        console.log('Question:', question.id);
        console.log('Original answers:', question.answers);
        console.log('Shuffled order:', order);
        console.log('Will display in this order:', order.map(i => question.answers[i]));
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLeaveCount((prevCount) => {
          const newCount = prevCount + 1;

          if (newCount >= 3) {
            alert(
              "You have left the quiz 3 times. You are being redirected to the home page. Better luck next time!"
            );
            navigate("/");
            return newCount;
          }

          alert("You left the quiz! Skipping to the next question.");
          handleNextQuestion();
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleNextQuestion, navigate]);

  const handleAnswer = (shuffledIndex) => {
    if (disabled) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const order = answerOrder[currentQuestion.id];
    const originalIndex = order[shuffledIndex];
    
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: originalIndex
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

  if (showingResult && previousAttempt) {
    return (
      <div className="quiz-container">
        <h2 className="quiz-title">Previous Attempt Result</h2>
        <div className="quiz-result">
          <p><strong>Score:</strong> {previousAttempt.result.score}%</p>
          <p><strong>Status:</strong> {previousAttempt.result.passed ? 'Passed' : 'Failed'}</p>
          <p><strong>Completed:</strong> {new Date(previousAttempt.result.completed_at).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  if (!questions.length || Object.keys(answerOrder).length === 0) {
    return <div className="quiz-container"><p>No questions available.</p></div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOrder = answerOrder[currentQuestion.id];

  return (
    <div className="quiz-container">
      {/*<h2 className="quiz-title">Technical Assessment</h2>*/}
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