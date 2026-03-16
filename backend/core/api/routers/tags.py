from django.db.models import CharField, Q, Value
from django.db.models.functions import Concat
from ninja import Router
from ninja.pagination import paginate

from ..models import Tag
from ..schema import TagOut

router = Router(tags=["Tags"])


@router.get(
    "/tags",
    response=list[TagOut],
    summary="Search tags",
    description=(
        "Returns all tags, optionally filtered by a substring"
        " match on the combined 'key:tag' value. Paginated."
    ),
)
@paginate
def get_tags(request, sub_str: str = None):
    q = Q()
    if sub_str:
        q &= Q(combined_tag__icontains=sub_str)

    tags = (
        Tag.objects.annotate(
            full_name=Concat("key", Value(":"), "tag", combined_tag=CharField())
        )
        .filter(q)
        .distinct()
    )
    return tags
