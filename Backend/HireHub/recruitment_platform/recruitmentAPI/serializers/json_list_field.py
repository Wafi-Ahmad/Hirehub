import json
from rest_framework import serializers

class JSONListField(serializers.Field):
    """
    Custom field to handle storing a Python list as a JSON string in the DB.
    """

    def to_representation(self, value):
        """
        Convert the JSON string in the model (e.g. '["skill1", "skill2"]') 
        back into a Python list for the API response.
        """
        if not value:
            # If the model field is empty or None, return an empty list
            return []
        try:
            return json.loads(value)  # parse JSON string -> list
        except (json.JSONDecodeError, TypeError):
            # Fallback if there's some weird data in the DB
            return []

    def to_internal_value(self, data):
        """
        Convert incoming request data (which should be a list or JSON-string)
        into a JSON-encoded string for storing in the DB model field.
        """
        # If the client sends a Python list directly: ["skill1","skill2"]
        if isinstance(data, list):
            return json.dumps(data)

        # If the client sends a JSON-encoded string: "[\"skill1\", \"skill2\"]"
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                # If the parsed data is indeed a list, we store it as JSON
                if isinstance(parsed, list):
                    return json.dumps(parsed)
            except (json.JSONDecodeError, TypeError):
                # If it can't parse, treat it as a single string element
                pass
            # Fallback: wrap in a list and then JSON-encode
            return json.dumps([data])

        # If something else is sent, fallback to an empty list
        return json.dumps([])
