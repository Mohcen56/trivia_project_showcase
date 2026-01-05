import sys
import unicodedata
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.db import transaction
from content.models import Question

class Command(BaseCommand):
    help = "Detect and optionally fix questions with broken/missing image files."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Scan and report only; do not modify records.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Process at most N questions (useful for testing).",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        limit = options.get("limit")

        qs = Question.objects.only("id", "image")
        total = qs.count()
        processed = 0
        broken_count = 0

        self.stdout.write(f"Scanning {total} questions... (dry_run={dry_run})\n")

        # Iterate efficiently in chunks to avoid memory spikes
        for q in qs.iterator(chunk_size=500):
            if limit is not None and processed >= limit:
                break
            processed += 1

            # Skip if no image set
            if not q.image:
                continue

            image_path = q.image.name or ""

            # Normalize path to guard against weird unicode forms
            normalized_path = unicodedata.normalize("NFC", image_path)

            # If normalization changes the path, treat original as potentially unsafe
            if normalized_path != image_path:
                self.stdout.write(self.style.WARNING(
                    f"[UNSAFE NAME] Question {q.id}: '{image_path}' -> normalized to '{normalized_path}'"
                ))
                if not dry_run:
                    # Avoid model save hooks that may touch other FileFields
                    Question.objects.filter(pk=q.pk).update(image=None)
                broken_count += 1
                continue

            # Check existence in storage, guarding storage errors
            try:
                exists = default_storage.exists(image_path)
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"[STORAGE ERROR] Question {q.id}: {image_path} -> {e}"
                ))
                exists = False

            if not exists:
                self.stdout.write(self.style.ERROR(
                    f"[MISSING FILE] Question {q.id}: {image_path}"
                ))
                if not dry_run:
                    # Avoid model save hooks that may touch other FileFields
                    Question.objects.filter(pk=q.pk).update(image=None)
                broken_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done! Processed {processed} / {total}. "
                f"{'Would fix' if dry_run else 'Fixed'} {broken_count} broken image entries."
            )
        )
