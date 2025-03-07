from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, OpenApiParameter
from ..serializers.job_serializers import (
    CreateJobSerializer,
    JobResponseSerializer,
    JobSearchSerializer,
    JobFeedbackSerializer
)
from ..services.job_services import JobService
from ..permissions import IsCompanyUser, IsJobOwner
from ..models import JobPost

class JobPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class JobListView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = JobPagination

    @extend_schema(
        parameters=[
            OpenApiParameter(name='title', description='Job title to search for', required=False, type=str),
            OpenApiParameter(name='location', description='Job location', required=False, type=str),
            OpenApiParameter(name='employment_type', description='Type of employment', required=False, type=str),
            OpenApiParameter(name='location_type', description='Type of location (remote/onsite)', required=False, type=str),
            OpenApiParameter(name='experience_level', description='Required experience level', required=False, type=str),
            OpenApiParameter(name='min_salary', description='Minimum salary', required=False, type=float),
            OpenApiParameter(name='max_salary', description='Maximum salary', required=False, type=float),
            OpenApiParameter(name='skills', description='Required skills (comma-separated)', required=False, type=str),
            OpenApiParameter(name='cursor', description='Pagination cursor (ISO8601 datetime)', required=False, type=str),
            OpenApiParameter(name='limit', description='Number of results per page', required=False, type=int),
            OpenApiParameter(name='followed_only', description='Show only jobs from followed companies', required=False, type=bool),
        ],
        responses=JobResponseSerializer(many=True)
    )
    def list(self, request):
        """List and search jobs with cursor-based pagination."""
        try:
            filters = {}
            
            # Handle search filters
            search_fields = [
                'title',
                'location',
                'employment_type',
                'location_type',
                'experience_level',
                'min_salary',
                'max_salary',
                'skills',
                'followed_only'
            ]

            # Process all filters
            for field in search_fields:
                if field == 'skills':
                    # Handle skills as a list (multiple skill parameters)
                    skills = request.query_params.getlist('skills')
                    if skills:
                        # Filter out empty skills
                        skills = [skill.strip().lower() for skill in skills if skill and skill.strip()]
                        if skills:
                            filters['skills'] = skills
                            print(f"Processing skills filter: {skills}")
                elif field in ['min_salary', 'max_salary']:
                    # Handle numeric fields
                    if value := request.query_params.get(field):
                        try:
                            filters[field] = float(value)
                            print(f"Processing {field} filter: {filters[field]}")
                        except (ValueError, TypeError):
                            print(f"Invalid {field} value: {value}")
                            continue
                elif field == 'followed_only':
                    # Handle boolean fields
                    if value := request.query_params.get(field):
                        value_lower = value.lower()
                        if value_lower in ['true', '1', 'yes']:
                            filters[field] = 'true'
                            print(f"Processing {field} filter: true")
                else:
                    # Handle text fields
                    if value := request.query_params.get(field):
                        value = value.strip()
                        if value:
                            filters[field] = value
                            print(f"Processing {field} filter: {value}")

            # Handle pagination
            cursor = request.query_params.get('cursor')
            try:
                limit = int(request.query_params.get('limit', 10))
            except (ValueError, TypeError):
                limit = 10

            # Get search results
            result = JobService.search_jobs(filters, cursor=cursor, limit=limit, user=request.user)
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error in job list view: {str(e)}")
            return Response(
                {'error': 'Failed to fetch jobs'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        request=CreateJobSerializer,
        responses={201: JobResponseSerializer}
    )
    def create(self, request):
        """Create a new job posting"""
        if request.user.user_type != 'Company':
            return Response(
                {'error': 'Only company users can create jobs'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            job = JobService.create_job(
                validated_data=serializer.validated_data,
                user_id=request.user.id
            )
            response_serializer = JobResponseSerializer(job)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class JobView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsJobOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(responses=JobResponseSerializer)
    def retrieve(self, request, pk=None):
        """Get detailed job information"""
        try:
            job = JobPost.objects.get(pk=pk)
            serializer = JobResponseSerializer(job)
            return Response(serializer.data)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        request=CreateJobSerializer,
        responses={200: JobResponseSerializer}
    )
    def update(self, request, pk=None):
        """Update a job posting"""
        try:
            job = JobPost.objects.get(pk=pk)
            self.check_object_permissions(request, job)
            
            serializer = CreateJobSerializer(job, data=request.data)
            if serializer.is_valid():
                updated_job = serializer.save()
                response_serializer = JobResponseSerializer(updated_job)
                return Response(response_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        request=CreateJobSerializer,
        responses={200: JobResponseSerializer}
    )
    def partial_update(self, request, pk=None):
        """Partially update a job posting"""
        try:
            job = JobPost.objects.get(pk=pk)
            self.check_object_permissions(request, job)
            
            serializer = CreateJobSerializer(job, data=request.data, partial=True)
            if serializer.is_valid():
                updated_job = serializer.save()
                response_serializer = JobResponseSerializer(updated_job)
                return Response(response_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        responses={204: None}
    )
    def destroy(self, request, pk=None):
        """Delete a job posting"""
        try:
            job = JobPost.objects.get(pk=pk)
            self.check_object_permissions(request, job)
            job.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        """Save a job for later reference"""
        try:
            job = JobPost.objects.get(pk=pk)
            user = request.user
            
            # Check if job is already saved
            if job in user.saved_jobs.all():
                user.saved_jobs.remove(job)
                message = "Job removed from saved jobs"
            else:
                user.saved_jobs.add(job)
                message = "Job saved successfully"
            
            return Response({'message': message}, status=status.HTTP_200_OK)
            
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        request=JobFeedbackSerializer,
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on job recommendation"""
        try:
            job = JobPost.objects.get(pk=pk)
            serializer = JobFeedbackSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Handle feedback logic here
            return Response({'message': 'Feedback submitted successfully'})
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        responses=JobResponseSerializer(many=True)
    )
    @action(detail=False, methods=['get'])
    def saved_jobs(self, request):
        """Get all jobs saved by the current user"""
        try:
            saved_jobs = request.user.saved_jobs.filter(is_active=True).order_by('-created_at')
            serializer = JobResponseSerializer(saved_jobs, many=True, context={'request': request})
            return Response({'jobs': serializer.data})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )