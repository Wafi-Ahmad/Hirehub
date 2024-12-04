#!/bin/sh

# Wait for database to be ready
echo "Waiting for MySQL to be ready..."
while ! nc -z db 3306; do
    sleep 1
done
echo "MySQL is ready!"

# Navigate to the Django project directory
cd recruitment_platform

# Make migrations
echo "Making migrations..."
python manage.py makemigrations

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

# Create superuser if needed (commented out by default)
# echo "Creating superuser..."
# python manage.py createsuperuser --noinput --username admin --email admin@example.com

# Start server
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000 