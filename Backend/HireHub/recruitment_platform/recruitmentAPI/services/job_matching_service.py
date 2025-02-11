from sentence_transformers import SentenceTransformer, util
import numpy as np

class JobMatchingService:
    _model = None
    SCORE_THRESHOLD = 30.0  # Lower threshold since embeddings naturally give lower scores

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @staticmethod
    def normalize_text(text):
        """Normalize text to lowercase and handle None values"""
        if isinstance(text, list):
            return ' '.join(str(item).lower().strip() for item in text if item)
        return text.lower().strip() if text else ""

    @classmethod
    def calculate_match_score(cls, job, user):
        """Calculate match score between a job and a user using embeddings"""
        try:
            # Get user text combining skills and experience
            user_skills = cls.normalize_text(user.skills)
            user_experience = cls.normalize_text(user.experience)
            user_text = f"{user_skills} {user_experience}"
            
            # Get job text combining title, description and skills
            job_skills = cls.normalize_text(job.required_skills)
            job_title = cls.normalize_text(job.title)
            job_desc = cls.normalize_text(job.description)
            # Give more weight to title and skills
            job_text = f"{job_title} {job_title} {job_desc} {job_skills} {job_skills}"
            
            print(f"\n=== Calculating Match Score for Job {job.id} ===")
            print(f"Job Title: {job_title}")
            print(f"Job Skills: {job_skills}")
            print(f"User Skills: {user_skills}")
            print(f"Normalized User Text: {user_text}")
            print(f"Normalized Job Text: {job_text}")
            
            # Get embeddings using the model
            model = cls.get_model()
            job_embedding = model.encode(job_text, convert_to_tensor=True)
            user_embedding = model.encode(user_text, convert_to_tensor=True)
            
            # Calculate cosine similarity between embeddings
            similarity = util.pytorch_cos_sim(job_embedding, user_embedding)
            score = float(similarity[0][0] * 100)
            
            print(f"Raw Score: {score}")
            print(f"Meets Threshold ({cls.SCORE_THRESHOLD})?: {score >= cls.SCORE_THRESHOLD}")
            print("=== End Calculating Match Score ===\n")
            
            return score
            
        except Exception as e:
            print(f"Error calculating match score: {str(e)}")
            return 0.0