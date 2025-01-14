from django.core.management.base import BaseCommand
from recruitmentAPI.models.post_model import Post

class Command(BaseCommand):
    help = 'Fix comment counts for all posts'

    def handle(self, *args, **options):
        posts = Post.objects.all()
        fixed_count = 0
        
        for post in posts:
            old_count = post.comments_count
            new_count = post.recalculate_comment_count()
            
            if old_count != new_count:
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Fixed post {post.id}: {old_count} -> {new_count} comments'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully fixed {fixed_count} posts'
            )
        ) 