from sentence_transformers import SentenceTransformer, util
import numpy as np

class JobMatchingService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @classmethod
    def calculate_match_score(cls, job, applicant):
        """
        Calculate match score between a job and an applicant
        Returns a score between 0 and 100
        """
        try:
            # Get job description and required skills
            job_text = f"{job.title} {job.description} {job.required_skills}"
            
            # Get applicant skills and experience
            applicant_text = ""
            if hasattr(applicant, 'skills'):
                applicant_text += f" {applicant.skills}"
            if hasattr(applicant, 'experience'):
                applicant_text += f" {applicant.experience}"
            if hasattr(applicant, 'bio'):
                applicant_text += f" {applicant.bio}"
            
            # If we don't have enough applicant information, return a default score
            if not applicant_text.strip():
                return 50.0
            
            # Get embeddings
            model = cls.get_model()
            job_embedding = model.encode(job_text, convert_to_tensor=True)
            applicant_embedding = model.encode(applicant_text, convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.pytorch_cos_sim(job_embedding, applicant_embedding)
            
            # Convert similarity to percentage (0-100)
            score = float(similarity[0][0] * 100)
            
            # Ensure score is between 0 and 100
            return max(0.0, min(100.0, score))
            
        except Exception as e:
            print(f"Error calculating match score: {str(e)}")
            return 50.0  # Return default score on error