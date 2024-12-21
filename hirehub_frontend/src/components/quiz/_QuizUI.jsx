import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./_Quiz.css";

function QuizUI() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaveCount, setLeaveCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/quizData.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setQuestions(data))
      .catch((error) => console.error("Error fetching quiz data:", error));
  }, []);

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setTimeLeft(60);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      alert(`Quiz completed! Your score: ${score}/${questions.length}`);
    }
  }, [currentQuestionIndex, questions.length, score]);

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

          // If the user has left the tab 3 times, redirect them to the home page
          if (newCount >= 3) {
            setScore(0); // Reset score
            alert(
              "You have left the quiz 3 times. You are being redirected to the home page. Better luck next time!"
            );
            navigate("/"); // Redirect to the home page
            return newCount;
          }

          // Otherwise, skip to the next question
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

  const handleAnswer = (index) => {
    if (index === questions[currentQuestionIndex].correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }
    setSelectedAnswer(index);

    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  if (questions.length === 0) {
    return <p>Loading quiz...</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <h2 className="quiz-title">Quiz</h2>
      <div className="progress-bar">
        <span
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></span>
      </div>
      <div>
        <p>
          Question {currentQuestionIndex + 1}/{questions.length}:
        </p>
        <h3>{currentQuestion.question}</h3>
        <p className="quiz-timer">
          <strong>Time Left: {timeLeft}s</strong>
        </p>
        <ul className="quiz-options">
          {currentQuestion.answers.map((answer, index) => (
            <li
              key={index}
              onClick={() => handleAnswer(index)}
              className={`quiz-option ${
                selectedAnswer === index
                  ? index === currentQuestion.correctAnswer
                    ? "selected"
                    : "incorrect"
                  : ""
              }`}
            >
              <div className="option-label">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="option-text">{answer}</div>
            </li>
          ))}
        </ul>
      </div>
      {/* Feedback about leave count */}
      <p className="leave-count-warning">
        {leaveCount > 0 && leaveCount < 3
          ? `Warning: You have left the quiz ${leaveCount} time(s).`
          : ""}
      </p>
    </div>
  );
}

export default QuizUI;
