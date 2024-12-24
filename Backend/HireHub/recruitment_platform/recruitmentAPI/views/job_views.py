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

class JobPostViewSet(viewsets.ViewSet):
    pagination_class = JobPagination
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [IsAuthenticated, IsCompanyUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsJobOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        request=CreateJobSerializer,
        responses={201: JobResponseSerializer}
    )
    def create(self, request):
        """Create a new job posting"""
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
        ],
        responses=JobResponseSerializer(many=True)
    )
    def list(self, request):
        """
        List and search jobs with **cursor-based** pagination.
        
        Pass ?cursor=<ISO8601 datetime> to get the next page
        older than that created_at date.
        Pass ?limit=<int> to control how many items returned per page.
        """
        # Parse the query params using your existing serializer
        search_serializer = JobSearchSerializer(data=request.query_params)
        search_serializer.is_valid(raise_exception=True)
        
        filters = search_serializer.validated_data

        # Retrieve optional cursor and limit from the request
        cursor = request.query_params.get('cursor')   # ISO8601 string
        limit = request.query_params.get('limit') or 10  # default to 10 if not provided

        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 10

        # Call the service which returns a dict { 'jobs': [...], 'next_cursor': <str|None> }
        result = JobService.search_jobs(filters, cursor=cursor, limit=limit)

        return Response({
            'jobs': result['jobs'],
            'next_cursor': result['next_cursor']
        }, status=status.HTTP_200_OK)

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
            if request.user in job.saved_by.all():
                job.saved_by.remove(request.user)
                message = "Job removed from saved jobs"
            else:
                job.saved_by.add(request.user)
                message = "Job saved successfully"
            return Response({'message': message})
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
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