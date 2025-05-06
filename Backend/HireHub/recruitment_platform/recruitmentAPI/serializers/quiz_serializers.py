from rest_framework import serializers
from ..models.quiz_model import Quiz, QuizAttempt
from django.contrib.auth import get_user_model

User = get_user_model()

# Serializer for displaying quiz metadata (not the full pool)
class QuizMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            'id', 
            'job_id',
            'start_difficulty',
            'passing_score', 
            'is_active',
            'created_at'
        ]
        read_only_fields = fields # All fields read-only here

# Serializer for representing a single question to the frontend
class QuizQuestionSerializer(serializers.Serializer): # Not a ModelSerializer
    ref = serializers.CharField(read_only=True, help_text="Unique reference like 'medium_5'")
    text = serializers.CharField(read_only=True)
    options = serializers.ListField(child=serializers.CharField(), read_only=True)

# Serializer for the response when starting or stepping through a quiz
class QuizStepResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['in_progress', 'finished'])
    question = QuizQuestionSerializer(required=False, help_text="The next question (only if status is 'in_progress')")
    # Fields below are only relevant when status is 'finished'
    message = serializers.CharField(required=False)
    score = serializers.IntegerField(required=False)
    passed = serializers.BooleanField(required=False)
    total_questions = serializers.IntegerField(required=False)
    correct_answers = serializers.IntegerField(required=False)
    

# Serializer for submitting an answer
class QuizAnswerSubmissionSerializer(serializers.Serializer): # Not a ModelSerializer
    question_ref = serializers.CharField(required=True, help_text="Reference of the question being answered (e.g., 'medium_2')")
    answer_index = serializers.IntegerField(required=True, min_value=0)

    def validate_answer_index(self, value):
        # Basic validation, range check happens in the service against actual options
        if value < 0:
            raise serializers.ValidationError("Answer index cannot be negative.")
        return value

# Serializer for displaying the final result of a completed attempt
class QuizResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            'score',
            'passed',
            'completed_at',
            'total_questions_served', # Use actual served count
        ]
        read_only_fields = fields
        
    # Add derived fields for clarity
    correct_answers = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField() # Target length

    def get_correct_answers(self, obj):
        # We need the service method to recalculate this reliably
        # Avoid calling DB/service methods directly in serializers if possible,
        # but here it might be necessary or passed via context.
        # For now, return a placeholder or calculate if simple enough.
        # Let's assume it can be calculated based on 'answers' if needed
        # Re-using service method is safer if logic is complex.
        from ..services.quiz_services import QuizService # Local import
        return QuizService._count_correct_answers(obj)

    def get_total_questions(self, obj):
        # Return the standard quiz length
        from ..services.quiz_services import TARGET_QUIZ_LENGTH # Local import
        return TARGET_QUIZ_LENGTH

# Updated QuizAttemptSerializer (might be used for admin or debugging)
class QuizAttemptSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    quiz_info = QuizMetadataSerializer(source='quiz', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id',
            'quiz_info', # Embed quiz metadata
            'user',
            'answers', # Shows the final submitted answers
            'score',
            'passed',
            'current_difficulty',
            'correct_streak',
            'incorrect_streak',
            'total_questions_served',
            'questions_answered', # Log of answered refs
            'started_at',
            'completed_at'
        ]
        read_only_fields = [f for f in fields if f != 'answers'] # Only answers might be writable in some contexts, but generally read-only

    def get_user(self, obj):
        user = obj.user
        return {
            'id': user.id,
            'email': user.email,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.email
        }

    # Removed validate_answers as the submission structure changed
    # Validation now happens in the view/service based on QuizAnswerSubmissionSerializer
