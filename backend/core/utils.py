"""
Utility functions that can be used across apps.
"""


def get_object_or_none(model_class, **kwargs):
    """
    Get an object if it exists, or None if it doesn't.
    Similar to get_object_or_404 but returns None instead of raising 404.
    """
    try:
        return model_class.objects.get(**kwargs)
    except model_class.DoesNotExist:
        return None


def is_valid_image_url(url):
    """
    Validates if the string is a proper URL that points to an image.
    Basic validation only - checks if the URL ends with common image extensions.
    """
    if not url:
        return False

    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    return any(url.lower().endswith(ext) for ext in image_extensions)