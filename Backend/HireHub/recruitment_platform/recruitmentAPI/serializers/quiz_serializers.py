from rest_framework import serializers
from ..models.quiz_model import Quiz, QuizAttempt
from django.contrib.auth import get_user_model

User = get_user_model()

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            'id',
            'questions',
            'passing_score',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_questions(self, questions):
        """Validate quiz questions format"""
        if not isinstance(questions, list):
            raise serializers.ValidationError("Questions must be a list")
        
        for question in questions:
            if not isinstance(question, dict):
                raise serializers.ValidationError("Each question must be an object")
            
            required_fields = ['question', 'options', 'correct_answer']
            for field in required_fields:
                if field not in question:
                    raise serializers.ValidationError(f"Question missing required field: {field}")
            
            if not isinstance(question['options'], list):
                raise serializers.ValidationError("Question options must be a list")
            
            if question['correct_answer'] not in question['options']:
                raise serializers.ValidationError("Correct answer must be one of the options")
        
        return questions

class QuizAttemptSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id',
            'quiz',
            'user',
            'answers',
            'score',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'score', 'created_at', 'updated_at']

    def get_user(self, obj):
        user = obj.user
        return {
            'id': user.id,
            'email': user.email,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.email
        }

    def validate_answers(self, answers):
        """Validate quiz answers format"""
        if not isinstance(answers, list):
            raise serializers.ValidationError("Answers must be a list")
        
        quiz = self.context.get('quiz')
        if not quiz:
            raise serializers.ValidationError("Quiz context is required")
        
        if len(answers) != len(quiz.questions):
            raise serializers.ValidationError(
                f"Number of answers ({len(answers)}) does not match number of questions ({len(quiz.questions)})"
            )
        
        return answers
