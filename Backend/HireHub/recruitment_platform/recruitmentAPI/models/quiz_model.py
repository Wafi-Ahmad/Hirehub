from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from .job_model import JobPost

User = get_user_model()

class Quiz(models.Model):
    job = models.OneToOneField(
        JobPost,
        on_delete=models.CASCADE,
        related_name='quiz'
    )
    questions = models.JSONField(
        help_text="Array of questions with their answers and correct answer"
    )
    passing_score = models.IntegerField(
        default=60,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ],
        help_text="Minimum score required to pass the quiz (percentage)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Quizzes"
        ordering = ['-created_at']

    def __str__(self):
        return f"Quiz for {self.job.title}"

class QuizAttempt(models.Model):
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quiz_attempts'
    )
    answers = models.JSONField(
        help_text="User's answers for the quiz questions"
    )
    score = models.IntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']
        # Ensure a user can only have one attempt per quiz
        unique_together = ['quiz', 'user']

    def __str__(self):
        return f"{self.user.email}'s attempt at {self.quiz}" 