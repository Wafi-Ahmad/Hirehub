from sentence_transformers import SentenceTransformer, util
import numpy as np

class JobMatchingService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Use a smaller but effective model for embeddings
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @classmethod
    def calculate_match_score(cls, job, user):
        """
        Calculate match score between a job and a user using embeddings
        Returns a score between 0 and 100
        """
        try:
            # Get job text combining title, description and skills
            job_text = f"{job.title} {job.description} {job.required_skills}"
            
            # Get user text combining skills and experience
            user_text = ""
            if hasattr(user, 'skills') and user.skills:
                user_text += f" {user.skills}"
            if hasattr(user, 'experience') and user.experience:
                user_text += f" {user.experience}"
            
            # If we don't have enough user information, return a low score
            if not user_text.strip():
                return 0.0
            
            # Get embeddings using the model
            model = cls.get_model()
            job_embedding = model.encode(job_text, convert_to_tensor=True)
            user_embedding = model.encode(user_text, convert_to_tensor=True)
            
            # Calculate cosine similarity between embeddings
            similarity = util.pytorch_cos_sim(job_embedding, user_embedding)
            
            # Convert similarity to percentage (0-100)
            score = float(similarity[0][0] * 100)
            
            # Ensure score is between 0 and 100
            return max(0.0, min(100.0, score))
            
        except Exception as e:
            print(f"Error calculating match score: {str(e)}")
            return 0.0