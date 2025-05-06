from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()

class Quiz(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    job = models.OneToOneField(
        'recruitmentAPI.JobPost',
        on_delete=models.CASCADE,
        related_name='job_quiz'
    )
    question_pool = models.JSONField(
        help_text="Questions categorized by difficulty: {'easy': [], 'medium': [], 'hard': []}"
    )
    start_difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium',
        help_text="Initial difficulty level for the quiz"
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
        default=dict,
        help_text="User's answers keyed by question reference (e.g., {'easy_0': 1, 'medium_2': 3})"
    )
    current_difficulty = models.CharField(
        max_length=10,
        choices=Quiz.DIFFICULTY_CHOICES,
        default='medium',
        help_text="Current difficulty level being presented"
    )
    questions_answered = models.JSONField(
        default=list,
        help_text="List of question references already answered in this attempt"
    )
    correct_streak = models.IntegerField(default=0)
    incorrect_streak = models.IntegerField(default=0)
    last_question_ref = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Reference to the last question presented"
    )
    total_questions_served = models.IntegerField(default=0)
    score = models.IntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ],
        null=True,
        blank=True
    )
    passed = models.BooleanField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']
        unique_together = ['quiz', 'user']

    def __str__(self):
        return f"{self.user.email}'s attempt at {self.quiz}"

    @property
    def is_finished(self):
        return self.completed_at is not None