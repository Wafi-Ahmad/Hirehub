from django.urls import path
from ..views.job_views import JobListView, JobView
from ..views.quiz_views import QuizView, QuizSubmissionView, QuizResultView, JobApplicantsView

urlpatterns = [
    # Job URLs
    path('', JobListView.as_view({'get': 'list', 'post': 'create'}), name='job-list'),
    path('<int:pk>/', JobView.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='job-detail'),
    
    # Quiz URLs
    path('<int:job_id>/quiz/', QuizView.as_view(), name='job-quiz'),
    path('quiz/<int:quiz_id>/submit/', QuizSubmissionView.as_view(), name='quiz-submit'),
    path('quiz/<int:quiz_id>/result/', QuizResultView.as_view(), name='quiz-result'),
    
    # Applicant URLs
    path('<int:job_id>/applicants/', JobApplicantsView.as_view(), name='job-applicants'),
]
