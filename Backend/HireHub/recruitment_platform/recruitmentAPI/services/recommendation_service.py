from django.db.models import Q
from ..models import User, JobPost
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class RecommendationService:
    def calculate_job_candidate_match(self, job_id, candidate_id):
        """
        Calculate the match score between a job and a candidate using their embeddings
        """
        try:
            job = JobPost.objects.get(id=job_id)
            candidate = User.objects.get(id=candidate_id)

            # Get embeddings
            job_embedding = self._get_job_embedding(job)
            candidate_embedding = self._get_candidate_embedding(candidate)

            if job_embedding is None or candidate_embedding is None:
                return 0.0

            # Calculate cosine similarity
            similarity = cosine_similarity(
                job_embedding.reshape(1, -1),
                candidate_embedding.reshape(1, -1)
            )[0][0]

            # Normalize to [0, 1]
            return float(max(0.0, min(1.0, (similarity + 1) / 2)))

        except (User.DoesNotExist, JobPost.DoesNotExist):
            return 0.0
        except Exception as e:
            print(f"Error calculating match score: {str(e)}")
            return 0.0

    def _get_job_embedding(self, job):
        """
        Create an embedding for a job based on its description and required skills
        """
        try:
            # Combine job description and skills
            job_text = f"{job.description} {job.required_skills}"
            
            # Here you would typically use a text embedding model
            # For now, we'll return a random embedding for demonstration
            # In production, use a proper embedding model like BERT or similar
            return np.random.rand(768)  # 768 is a common embedding dimension

        except Exception as e:
            print(f"Error getting job embedding: {str(e)}")
            return None

    def _get_candidate_embedding(self, candidate):
        """
        Get or create embedding for a candidate based on their skills and experience
        """
        try:
            if candidate.profile_embedding:
                # If we already have a stored embedding, use it
                return candidate.get_profile_embedding()
            
            # Combine relevant candidate information
            candidate_text = f"{candidate.skills} {candidate.experience}"
            
            # Here you would typically use a text embedding model
            # For now, we'll return a random embedding for demonstration
            # In production, use a proper embedding model like BERT or similar
            return np.random.rand(768)  # 768 is a common embedding dimension

        except Exception as e:
            print(f"Error getting candidate embedding: {str(e)}")
            return None
