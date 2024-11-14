from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from recruitmentAPI.permissions import IsCompanyUser
from recruitmentAPI.services.role_services import RoleService
from recruitmentAPI.serializers.role_serializers import RoleAssignmentSerializer

class AssignRoleView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def post(self, request):
        serializer = RoleAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            role = serializer.validated_data['role']
            result = RoleService.assign_role(user_id, role)
            return Response(result)
        return Response(serializer.errors, status=400)

class RemoveRoleView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def post(self, request, user_id):
        result = RoleService.remove_role(user_id)
        return Response(result)