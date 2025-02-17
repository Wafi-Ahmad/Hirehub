from django.urls import path
from ..views.job_views import JobListView, JobView
from ..views.quiz_views import QuizView, QuizSubmissionView, QuizResultView, JobApplicantsView
from ..views.job_offer_views import SendJobOfferView

urlpatterns = [
    # Job URLs
    path('', JobListView.as_view({'get': 'list', 'post': 'create'}), name='job-list'),
    path('<int:pk>/', JobView.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='job-detail'),
    path('<int:pk>/save/', JobView.as_view({'post': 'save'}), name='job-save'),
    path('saved/', JobView.as_view({'get': 'saved_jobs'}), name='saved-jobs'),
    
    # Quiz URLs
    path('<int:job_id>/quiz/', QuizView.as_view(), name='quiz-detail'),
    path('<int:job_id>/quiz/submit/', QuizSubmissionView.as_view(), name='quiz-submit'),
    path('<int:job_id>/quiz/result/', QuizResultView.as_view(), name='quiz-result'),
    
    # Applicant URLs
    path('<int:job_id>/applicants/', JobApplicantsView.as_view(), name='job-applicants'),
    path('<int:job_id>/send-offer/<int:applicant_id>/', SendJobOfferView.as_view(), name='send-job-offer'),
]
