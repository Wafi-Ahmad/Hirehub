from recruitmentAPI.models.user_model import User, POSTGRES_AVAILABLE
from django.db.models import Count, Q, F
from django.db import connection
from django.utils import timezone
from sentence_transformers import SentenceTransformer
import numpy as np
import json
from django.conf import settings
import torch

class UserService:
    # Initialize the embedding model (will be loaded only once)
    _embedding_model = None

    @classmethod
    def get_embedding_model(cls):
        """Get or initialize the embedding model."""
        if cls._embedding_model is None:
            print("Loading embedding model...")
            cls._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._embedding_model

    @staticmethod
    def generate_user_embedding(user):
        """
        Generate embedding vector for a user based on their profile data,
        and return the embedding as a JSON string.
        """
        try:
            # Combine relevant user information into a text representation
            profile_text = f"{user.first_name or ''} {user.last_name or ''} "
            
            if user.headline:
                profile_text += f"{user.headline} "
            if user.current_work:
                profile_text += f"{user.current_work} "
            if user.skills:
                profile_text += f"{user.skills} "
            if user.experience:
                profile_text += f"{user.experience} "
            if user.preferred_job_category:
                profile_text += f"{user.preferred_job_category} "
            
            print("Generating embedding for user:", user.email)
            # Generate embedding
            model = UserService.get_embedding_model()
            embedding_array = model.encode(profile_text)

            # Convert to Python list, then to JSON (with commas)
            embedding_list = embedding_array.tolist()
            embedding_json = json.dumps(embedding_list)  # Valid JSON string
            return embedding_json
        except Exception as e:
            print(f"Error generating embedding for user {user.email}: {str(e)}")
            return None

    @staticmethod
    def update_user_embedding(user_id):
        """
        Update the embedding for a user by regenerating and storing it as JSON.
        """
        try:
            user = User.objects.get(pk=user_id)
            embedding_json = UserService.generate_user_embedding(user)
            if embedding_json is not None:
                user.profile_embedding = embedding_json
                user.embedding_updated_at = timezone.now()
                user.save(update_fields=['profile_embedding', 'embedding_updated_at'])
                return True
            else:
                print("Embedding generation returned None.")
                return False
        except Exception as e:
            print(f"Error updating user embedding: {str(e)}")
            return False

    @staticmethod
    def get_user_embedding(user):
        """
        Helper method to get the user's embedding as a NumPy array.
        Returns None if there's no embedding or an error occurs.
        """
        if not user.profile_embedding:
            return None
        try:
            # Deserialize JSON string -> Python list -> NumPy array
            embedding_list = json.loads(user.profile_embedding)
            return np.array(embedding_list, dtype=np.float32)
        except Exception as e:
            print(f"Error retrieving user embedding: {str(e)}")
            return None

    @staticmethod
    def get_hybrid_recommendations(user_id, limit=5):
        """
        Get recommendations using both mutual connections and embedding similarity.
        Returns a list of User objects.
        """
        print(f"Starting get_hybrid_recommendations for user_id: {user_id} with limit: {limit}")
        try:
            user = User.objects.get(pk=user_id)
            print(f"User found: {user.email}")

            # 1. Get mutual connection recommendations
            print("Fetching mutual connection recommendations...")
            mutual_recs = UserService.get_connection_recommendations(user_id, limit=limit)
            mutual_rec_ids = {u.id for u in mutual_recs}
            print(f"Mutual recommendations found: {len(mutual_recs)}")

            # 2. Get user's embedding
            print("Fetching user's embedding...")
            user_embedding_data = UserService.get_user_embedding(user)
            print(f"User embedding data retrieved: {user_embedding_data}")

            # 3. If user has embeddings, attempt similarity-based recommendations
            if user_embedding_data is not None:
                print("User has embeddings, proceeding with similarity-based recommendations...")
                user_embedding = np.array(user_embedding_data, dtype=np.float32)

                # 4. Fetch candidate users
                print("Fetching candidate users for similarity calculation...")
                candidates = User.objects.exclude(
                    Q(id=user_id) |
                    Q(id__in=user.following.all()) |
                    Q(id__in=mutual_rec_ids)
                ).filter(
                    profile_embedding__isnull=False,
                    is_active=True,
                    is_profile_public=True
                )
                print(f"Candidate users found: {candidates.count()}")

                # 5. Calculate similarity scores
                similarities = []
                for candidate in candidates:
                    candidate_embedding_data = UserService.get_user_embedding(candidate)
                    if candidate_embedding_data is not None:
                        candidate_embedding = np.array(candidate_embedding_data, dtype=np.float32)
                        # Cosine similarity
                        similarity = np.dot(user_embedding, candidate_embedding) / (
                            np.linalg.norm(user_embedding) * np.linalg.norm(candidate_embedding)
                        )
                        if similarity > 0.35:
                            similarities.append((candidate, similarity))
                            print(f"Calculated similarity for candidate {candidate.email}: {similarity}")

                # 6. Sort by similarity and get top
                print("Sorting candidates by similarity...")
                similarity_recs = sorted(similarities, key=lambda x: x[1], reverse=True)[:limit]
                similarity_users = [rec[0] for rec in similarity_recs]
                print("Top similarity recommendations:", [u.email for u in similarity_users])

                # 7. Combine mutual + similarity recommendations (interleaving)
                hybrid_recs = []
                mutual_recs = list(mutual_recs)
                i, j = 0, 0

                print("Combining mutual and similarity recommendations...")
                while len(hybrid_recs) < limit and (i < len(mutual_recs) or j < len(similarity_users)):
                    if i < len(mutual_recs):
                        hybrid_recs.append(mutual_recs[i])
                        print(f"Added mutual recommendation: {mutual_recs[i].email}")
                        i += 1
                    if j < len(similarity_users) and len(hybrid_recs) < limit:
                        hybrid_recs.append(similarity_users[j])
                        print(f"Added similarity recommendation: {similarity_users[j].email}")
                        j += 1

                print(f"Hybrid recommendations generated: {[u.email for u in hybrid_recs]}")
                return hybrid_recs

            # If no embeddings, return mutual connection recommendations only
            print("No embeddings found, returning mutual recommendations.")
            return mutual_recs

        except User.DoesNotExist:
            print("User not found.")
            raise ValueError("User not found")
        except Exception as e:
            print(f"Error in get_hybrid_recommendations: {str(e)}")
            raise e

    @staticmethod
    def create_user(email, first_name, last_name, password, **extra_fields):
        """
        Handle the business logic of creating a user.
        """
        if User.objects.filter(email=email).exists():
            raise ValueError('A user with this email already exists.')

        profile_picture = extra_fields.pop('profile_picture', None)
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            **extra_fields
        )
        if profile_picture:
            user.profile_picture = profile_picture
            user.save()
        return user

    @staticmethod
    def update_user(user_id, **data):
        """
        Update the user's profile information.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.date_of_birth = data.get('date_of_birth', user.date_of_birth)
            user.company_name = data.get('company_name', user.company_name)
            user.profile_picture = data.get('profile_picture', user.profile_picture)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def update_basic_info(user_id, **data):
        """
        Update the user's basic profile information, such as skills, experience, recent work, etc.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.skills = data.get('skills', user.skills)
            user.experience = data.get('experience', user.experience)
            user.recent_work = data.get('recent_work', user.recent_work)
            user.current_work = data.get('current_work', user.current_work)
            user.contact_details = data.get('contact_details', user.contact_details)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def update_privacy_settings(user_id, **data):
        """
        Update privacy settings for a user.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.is_profile_public = data.get('is_profile_public', user.is_profile_public)
            user.show_email = data.get('show_email', user.show_email)
            user.show_skills = data.get('show_skills', user.show_skills)
            user.show_experience = data.get('show_experience', user.show_experience)
            user.show_recent_work = data.get('show_recent_work', user.show_recent_work)
            user.show_current_work = data.get('show_current_work', user.show_current_work)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def delete_user(user_id):
        """
        Permanently delete a user account and all related data.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.delete()
            return {"message": "User account deleted successfully."}
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def get_connection_recommendations(user_id, limit=5):
        """
        Get recommended connections based on mutual connections.

        Steps:
          1. Get user's current connections (followers/following).
          2. Find second-degree connections (friends of friends).
          3. Calculate mutual connection counts.
          4. Filter for active and public profiles.
          5. Sort by mutual connections, plus a simple profile completeness measure.
        """
        try:
            user = User.objects.get(pk=user_id)

            # Get IDs of users the current user is following
            following_ids = set(user.following.values_list('id', flat=True))

            # Find second-degree connections with mutual connection counts
            recommendations = (
                User.objects.exclude(
                    Q(id=user_id) | Q(id__in=following_ids)
                )
                .filter(
                    is_active=True,
                    is_profile_public=True,
                    # Users who are followed by people the current user follows
                    followers__in=following_ids
                )
                .annotate(
                    mutual_connections_count=Count(
                        'followers',
                        filter=Q(followers__in=following_ids)
                    ),
                    # Simple measure of profile completeness
                    profile_score=Count(
                        'id',
                        filter=(
                            Q(first_name__isnull=False)
                            & Q(last_name__isnull=False)
                            & Q(profile_picture__isnull=False)
                            | Q(headline__isnull=False)
                            | Q(current_work__isnull=False)
                            | Q(skills__isnull=False)
                        ),
                    )
                )
                .filter(
                    mutual_connections_count__gt=0,
                    profile_score__gt=0
                )
                .order_by(
                    '-mutual_connections_count',
                    '-profile_score',
                    '-id'  # Newer users first if ties
                )[:limit]
            )

            return recommendations

        except User.DoesNotExist:
            raise ValueError("User not found")
        except Exception as e:
            print(f"Error in get_connection_recommendations: {str(e)}")
            raise e
