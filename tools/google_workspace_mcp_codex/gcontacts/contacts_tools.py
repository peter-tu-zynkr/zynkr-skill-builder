"""
Google Contacts MCP Tools (People API)

This module provides MCP tools for interacting with Google Contacts via the People API.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from googleapiclient.errors import HttpError
from mcp import Resource

from auth.service_decorator import require_google_service
from core.server import server
from core.utils import handle_http_errors

logger = logging.getLogger(__name__)

# Default person fields for list/search operations
DEFAULT_PERSON_FIELDS = "names,emailAddresses,phoneNumbers,organizations"

# Detailed person fields for get operations
DETAILED_PERSON_FIELDS = (
    "names,emailAddresses,phoneNumbers,organizations,biographies,"
    "addresses,birthdays,urls,photos,metadata,memberships"
)

# Contact group fields
CONTACT_GROUP_FIELDS = "name,groupType,memberCount,metadata"

# Cache warmup tracking
_search_cache_warmed_up: Dict[str, bool] = {}


def _format_contact(person: Dict[str, Any], detailed: bool = False) -> str:
    """
    Format a Person resource into a readable string.

    Args:
        person: The Person resource from the People API.
        detailed: Whether to include detailed fields.

    Returns:
        Formatted string representation of the contact.
    """
    resource_name = person.get("resourceName", "Unknown")
    contact_id = resource_name.replace("people/", "") if resource_name else "Unknown"

    lines = [f"Contact ID: {contact_id}"]

    # Names
    names = person.get("names", [])
    if names:
        primary_name = names[0]
        display_name = primary_name.get("displayName", "")
        if display_name:
            lines.append(f"Name: {display_name}")

    # Email addresses
    emails = person.get("emailAddresses", [])
    if emails:
        email_list = [e.get("value", "") for e in emails if e.get("value")]
        if email_list:
            lines.append(f"Email: {', '.join(email_list)}")

    # Phone numbers
    phones = person.get("phoneNumbers", [])
    if phones:
        phone_list = [p.get("value", "") for p in phones if p.get("value")]
        if phone_list:
            lines.append(f"Phone: {', '.join(phone_list)}")

    # Organizations
    orgs = person.get("organizations", [])
    if orgs:
        org = orgs[0]
        org_parts = []
        if org.get("title"):
            org_parts.append(org["title"])
        if org.get("name"):
            org_parts.append(f"at {org['name']}")
        if org_parts:
            lines.append(f"Organization: {' '.join(org_parts)}")

    if detailed:
        # Addresses
        addresses = person.get("addresses", [])
        if addresses:
            addr = addresses[0]
            formatted_addr = addr.get("formattedValue", "")
            if formatted_addr:
                lines.append(f"Address: {formatted_addr}")

        # Birthday
        birthdays = person.get("birthdays", [])
        if birthdays:
            bday = birthdays[0].get("date", {})
            if bday:
                bday_str = f"{bday.get('month', '?')}/{bday.get('day', '?')}"
                if bday.get("year"):
                    bday_str = f"{bday.get('year')}/{bday_str}"
                lines.append(f"Birthday: {bday_str}")

        # URLs
        urls = person.get("urls", [])
        if urls:
            url_list = [u.get("value", "") for u in urls if u.get("value")]
            if url_list:
                lines.append(f"URLs: {', '.join(url_list)}")

        # Biography/Notes
        bios = person.get("biographies", [])
        if bios:
            bio = bios[0].get("value", "")
            if bio:
                # Truncate long bios
                if len(bio) > 200:
                    bio = bio[:200] + "..."
                lines.append(f"Notes: {bio}")

        # Metadata
        metadata = person.get("metadata", {})
        if metadata:
            sources = metadata.get("sources", [])
            if sources:
                source_types = [s.get("type", "") for s in sources]
                if source_types:
                    lines.append(f"Sources: {', '.join(source_types)}")

    return "\n".join(lines)


def _build_person_body(
    given_name: Optional[str] = None,
    family_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    organization: Optional[str] = None,
    job_title: Optional[str] = None,
    notes: Optional[str] = None,
    address: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a Person resource body for create/update operations.

    Args:
        given_name: First name.
        family_name: Last name.
        email: Email address.
        phone: Phone number.
        organization: Company/organization name.
        job_title: Job title.
        notes: Additional notes/biography.
        address: Street address.

    Returns:
        Person resource body dictionary.
    """
    body: Dict[str, Any] = {}

    if given_name or family_name:
        body["names"] = [
            {
                "givenName": given_name or "",
                "familyName": family_name or "",
            }
        ]

    if email:
        body["emailAddresses"] = [{"value": email}]

    if phone:
        body["phoneNumbers"] = [{"value": phone}]

    if organization or job_title:
        org_entry: Dict[str, str] = {}
        if organization:
            org_entry["name"] = organization
        if job_title:
            org_entry["title"] = job_title
        body["organizations"] = [org_entry]

    if notes:
        body["biographies"] = [{"value": notes, "contentType": "TEXT_PLAIN"}]

    if address:
        body["addresses"] = [{"formattedValue": address}]

    return body


async def _warmup_search_cache(service: Resource, user_google_email: str) -> None:
    """
    Warm up the People API search cache.

    The People API requires an initial empty query to warm up the search cache
    before searches will return results.

    Args:
        service: Authenticated People API service.
        user_google_email: User's email for tracking.
    """
    global _search_cache_warmed_up

    if _search_cache_warmed_up.get(user_google_email):
        return

    try:
        logger.debug(f"[contacts] Warming up search cache for {user_google_email}")
        await asyncio.to_thread(
            service.people()
            .searchContacts(query="", readMask="names", pageSize=1)
            .execute
        )
        _search_cache_warmed_up[user_google_email] = True
        logger.debug(f"[contacts] Search cache warmed up for {user_google_email}")
    except HttpError as e:
        # Warmup failure is non-fatal, search may still work
        logger.warning(f"[contacts] Search cache warmup failed: {e}")


# =============================================================================
# Core Tier Tools
# =============================================================================


@server.tool()
@require_google_service("people", "contacts_read")
@handle_http_errors("list_contacts", service_type="people")
async def list_contacts(
    service: Resource,
    user_google_email: str,
    page_size: int = 100,
    page_token: Optional[str] = None,
    sort_order: Optional[str] = None,
) -> str:
    """
    List contacts for the authenticated user.

    Args:
        user_google_email (str): The user's Google email address. Required.
        page_size (int): Maximum number of contacts to return (default: 100, max: 1000).
        page_token (Optional[str]): Token for pagination.
        sort_order (Optional[str]): Sort order: "LAST_MODIFIED_ASCENDING", "LAST_MODIFIED_DESCENDING", "FIRST_NAME_ASCENDING", or "LAST_NAME_ASCENDING".

    Returns:
        str: List of contacts with their basic information.
    """
    logger.info(f"[list_contacts] Invoked. Email: '{user_google_email}'")

    try:
        params: Dict[str, Any] = {
            "resourceName": "people/me",
            "personFields": DEFAULT_PERSON_FIELDS,
            "pageSize": min(page_size, 1000),
        }

        if page_token:
            params["pageToken"] = page_token
        if sort_order:
            params["sortOrder"] = sort_order

        result = await asyncio.to_thread(
            service.people().connections().list(**params).execute
        )

        connections = result.get("connections", [])
        next_page_token = result.get("nextPageToken")
        total_people = result.get("totalPeople", len(connections))

        if not connections:
            return f"No contacts found for {user_google_email}."

        response = f"Contacts for {user_google_email} ({len(connections)} of {total_people}):\n\n"

        for person in connections:
            response += _format_contact(person) + "\n\n"

        if next_page_token:
            response += f"Next page token: {next_page_token}"

        logger.info(f"Found {len(connections)} contacts for {user_google_email}")
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts_read")
@handle_http_errors("get_contact", service_type="people")
async def get_contact(
    service: Resource,
    user_google_email: str,
    contact_id: str,
) -> str:
    """
    Get detailed information about a specific contact.

    Args:
        user_google_email (str): The user's Google email address. Required.
        contact_id (str): The contact ID (e.g., "c1234567890" or full resource name "people/c1234567890").

    Returns:
        str: Detailed contact information.
    """
    # Normalize resource name
    if not contact_id.startswith("people/"):
        resource_name = f"people/{contact_id}"
    else:
        resource_name = contact_id

    logger.info(
        f"[get_contact] Invoked. Email: '{user_google_email}', Contact: {resource_name}"
    )

    try:
        person = await asyncio.to_thread(
            service.people()
            .get(resourceName=resource_name, personFields=DETAILED_PERSON_FIELDS)
            .execute
        )

        response = f"Contact Details for {user_google_email}:\n\n"
        response += _format_contact(person, detailed=True)

        logger.info(f"Retrieved contact {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact not found: {contact_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts_read")
@handle_http_errors("search_contacts", service_type="people")
async def search_contacts(
    service: Resource,
    user_google_email: str,
    query: str,
    page_size: int = 30,
) -> str:
    """
    Search contacts by name, email, phone number, or other fields.

    Args:
        user_google_email (str): The user's Google email address. Required.
        query (str): Search query string (searches names, emails, phone numbers).
        page_size (int): Maximum number of results to return (default: 30, max: 30).

    Returns:
        str: Matching contacts with their basic information.
    """
    logger.info(
        f"[search_contacts] Invoked. Email: '{user_google_email}', Query: '{query}'"
    )

    try:
        # Warm up the search cache if needed
        await _warmup_search_cache(service, user_google_email)

        result = await asyncio.to_thread(
            service.people()
            .searchContacts(
                query=query,
                readMask=DEFAULT_PERSON_FIELDS,
                pageSize=min(page_size, 30),
            )
            .execute
        )

        results = result.get("results", [])

        if not results:
            return f"No contacts found matching '{query}' for {user_google_email}."

        response = f"Search Results for '{query}' ({len(results)} found):\n\n"

        for item in results:
            person = item.get("person", {})
            response += _format_contact(person) + "\n\n"

        logger.info(
            f"Found {len(results)} contacts matching '{query}' for {user_google_email}"
        )
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("create_contact", service_type="people")
async def create_contact(
    service: Resource,
    user_google_email: str,
    given_name: Optional[str] = None,
    family_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    organization: Optional[str] = None,
    job_title: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Create a new contact.

    Args:
        user_google_email (str): The user's Google email address. Required.
        given_name (Optional[str]): First name.
        family_name (Optional[str]): Last name.
        email (Optional[str]): Email address.
        phone (Optional[str]): Phone number.
        organization (Optional[str]): Company/organization name.
        job_title (Optional[str]): Job title.
        notes (Optional[str]): Additional notes.

    Returns:
        str: Confirmation with the new contact's details.
    """
    logger.info(
        f"[create_contact] Invoked. Email: '{user_google_email}', Name: '{given_name} {family_name}'"
    )

    try:
        body = _build_person_body(
            given_name=given_name,
            family_name=family_name,
            email=email,
            phone=phone,
            organization=organization,
            job_title=job_title,
            notes=notes,
        )

        if not body:
            raise Exception(
                "At least one field (name, email, phone, etc.) must be provided."
            )

        result = await asyncio.to_thread(
            service.people()
            .createContact(body=body, personFields=DETAILED_PERSON_FIELDS)
            .execute
        )

        response = f"Contact Created for {user_google_email}:\n\n"
        response += _format_contact(result, detailed=True)

        contact_id = result.get("resourceName", "").replace("people/", "")
        logger.info(f"Created contact {contact_id} for {user_google_email}")
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


# =============================================================================
# Extended Tier Tools
# =============================================================================


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("update_contact", service_type="people")
async def update_contact(
    service: Resource,
    user_google_email: str,
    contact_id: str,
    given_name: Optional[str] = None,
    family_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    organization: Optional[str] = None,
    job_title: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Update an existing contact. Note: This replaces fields, not merges them.

    Args:
        user_google_email (str): The user's Google email address. Required.
        contact_id (str): The contact ID to update.
        given_name (Optional[str]): New first name.
        family_name (Optional[str]): New last name.
        email (Optional[str]): New email address.
        phone (Optional[str]): New phone number.
        organization (Optional[str]): New company/organization name.
        job_title (Optional[str]): New job title.
        notes (Optional[str]): New notes.

    Returns:
        str: Confirmation with updated contact details.
    """
    # Normalize resource name
    if not contact_id.startswith("people/"):
        resource_name = f"people/{contact_id}"
    else:
        resource_name = contact_id

    logger.info(
        f"[update_contact] Invoked. Email: '{user_google_email}', Contact: {resource_name}"
    )

    try:
        # First fetch the contact to get the etag
        current = await asyncio.to_thread(
            service.people()
            .get(resourceName=resource_name, personFields=DETAILED_PERSON_FIELDS)
            .execute
        )

        etag = current.get("etag")
        if not etag:
            raise Exception("Unable to get contact etag for update.")

        # Build update body
        body = _build_person_body(
            given_name=given_name,
            family_name=family_name,
            email=email,
            phone=phone,
            organization=organization,
            job_title=job_title,
            notes=notes,
        )

        if not body:
            raise Exception(
                "At least one field (name, email, phone, etc.) must be provided."
            )

        body["etag"] = etag

        # Determine which fields to update
        update_person_fields = []
        if "names" in body:
            update_person_fields.append("names")
        if "emailAddresses" in body:
            update_person_fields.append("emailAddresses")
        if "phoneNumbers" in body:
            update_person_fields.append("phoneNumbers")
        if "organizations" in body:
            update_person_fields.append("organizations")
        if "biographies" in body:
            update_person_fields.append("biographies")
        if "addresses" in body:
            update_person_fields.append("addresses")

        result = await asyncio.to_thread(
            service.people()
            .updateContact(
                resourceName=resource_name,
                body=body,
                updatePersonFields=",".join(update_person_fields),
                personFields=DETAILED_PERSON_FIELDS,
            )
            .execute
        )

        response = f"Contact Updated for {user_google_email}:\n\n"
        response += _format_contact(result, detailed=True)

        logger.info(f"Updated contact {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact not found: {contact_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("delete_contact", service_type="people")
async def delete_contact(
    service: Resource,
    user_google_email: str,
    contact_id: str,
) -> str:
    """
    Delete a contact.

    Args:
        user_google_email (str): The user's Google email address. Required.
        contact_id (str): The contact ID to delete.

    Returns:
        str: Confirmation message.
    """
    # Normalize resource name
    if not contact_id.startswith("people/"):
        resource_name = f"people/{contact_id}"
    else:
        resource_name = contact_id

    logger.info(
        f"[delete_contact] Invoked. Email: '{user_google_email}', Contact: {resource_name}"
    )

    try:
        await asyncio.to_thread(
            service.people().deleteContact(resourceName=resource_name).execute
        )

        response = f"Contact {contact_id} has been deleted for {user_google_email}."

        logger.info(f"Deleted contact {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact not found: {contact_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts_read")
@handle_http_errors("list_contact_groups", service_type="people")
async def list_contact_groups(
    service: Resource,
    user_google_email: str,
    page_size: int = 100,
    page_token: Optional[str] = None,
) -> str:
    """
    List contact groups (labels) for the user.

    Args:
        user_google_email (str): The user's Google email address. Required.
        page_size (int): Maximum number of groups to return (default: 100, max: 1000).
        page_token (Optional[str]): Token for pagination.

    Returns:
        str: List of contact groups with their details.
    """
    logger.info(f"[list_contact_groups] Invoked. Email: '{user_google_email}'")

    try:
        params: Dict[str, Any] = {
            "pageSize": min(page_size, 1000),
            "groupFields": CONTACT_GROUP_FIELDS,
        }

        if page_token:
            params["pageToken"] = page_token

        result = await asyncio.to_thread(service.contactGroups().list(**params).execute)

        groups = result.get("contactGroups", [])
        next_page_token = result.get("nextPageToken")

        if not groups:
            return f"No contact groups found for {user_google_email}."

        response = f"Contact Groups for {user_google_email}:\n\n"

        for group in groups:
            resource_name = group.get("resourceName", "")
            group_id = resource_name.replace("contactGroups/", "")
            name = group.get("name", "Unnamed")
            group_type = group.get("groupType", "USER_CONTACT_GROUP")
            member_count = group.get("memberCount", 0)

            response += f"- {name}\n"
            response += f"  ID: {group_id}\n"
            response += f"  Type: {group_type}\n"
            response += f"  Members: {member_count}\n\n"

        if next_page_token:
            response += f"Next page token: {next_page_token}"

        logger.info(f"Found {len(groups)} contact groups for {user_google_email}")
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts_read")
@handle_http_errors("get_contact_group", service_type="people")
async def get_contact_group(
    service: Resource,
    user_google_email: str,
    group_id: str,
    max_members: int = 100,
) -> str:
    """
    Get details of a specific contact group including its members.

    Args:
        user_google_email (str): The user's Google email address. Required.
        group_id (str): The contact group ID.
        max_members (int): Maximum number of members to return (default: 100, max: 1000).

    Returns:
        str: Contact group details including members.
    """
    # Normalize resource name
    if not group_id.startswith("contactGroups/"):
        resource_name = f"contactGroups/{group_id}"
    else:
        resource_name = group_id

    logger.info(
        f"[get_contact_group] Invoked. Email: '{user_google_email}', Group: {resource_name}"
    )

    try:
        result = await asyncio.to_thread(
            service.contactGroups()
            .get(
                resourceName=resource_name,
                maxMembers=min(max_members, 1000),
                groupFields=CONTACT_GROUP_FIELDS,
            )
            .execute
        )

        name = result.get("name", "Unnamed")
        group_type = result.get("groupType", "USER_CONTACT_GROUP")
        member_count = result.get("memberCount", 0)
        member_resource_names = result.get("memberResourceNames", [])

        response = f"Contact Group Details for {user_google_email}:\n\n"
        response += f"Name: {name}\n"
        response += f"ID: {group_id}\n"
        response += f"Type: {group_type}\n"
        response += f"Total Members: {member_count}\n"

        if member_resource_names:
            response += f"\nMembers ({len(member_resource_names)} shown):\n"
            for member in member_resource_names:
                contact_id = member.replace("people/", "")
                response += f"  - {contact_id}\n"

        logger.info(f"Retrieved contact group {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact group not found: {group_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


# =============================================================================
# Complete Tier Tools
# =============================================================================


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("batch_create_contacts", service_type="people")
async def batch_create_contacts(
    service: Resource,
    user_google_email: str,
    contacts: List[Dict[str, str]],
) -> str:
    """
    Create multiple contacts in a batch operation.

    Args:
        user_google_email (str): The user's Google email address. Required.
        contacts (List[Dict[str, str]]): List of contact dictionaries with fields:
            - given_name: First name
            - family_name: Last name
            - email: Email address
            - phone: Phone number
            - organization: Company name
            - job_title: Job title

    Returns:
        str: Confirmation with created contacts.
    """
    logger.info(
        f"[batch_create_contacts] Invoked. Email: '{user_google_email}', Count: {len(contacts)}"
    )

    try:
        if not contacts:
            raise Exception("At least one contact must be provided.")

        if len(contacts) > 200:
            raise Exception("Maximum 200 contacts can be created in a batch.")

        # Build batch request body
        contact_bodies = []
        for contact in contacts:
            body = _build_person_body(
                given_name=contact.get("given_name"),
                family_name=contact.get("family_name"),
                email=contact.get("email"),
                phone=contact.get("phone"),
                organization=contact.get("organization"),
                job_title=contact.get("job_title"),
            )
            if body:
                contact_bodies.append({"contactPerson": body})

        if not contact_bodies:
            raise Exception("No valid contact data provided.")

        batch_body = {
            "contacts": contact_bodies,
            "readMask": DEFAULT_PERSON_FIELDS,
        }

        result = await asyncio.to_thread(
            service.people().batchCreateContacts(body=batch_body).execute
        )

        created_people = result.get("createdPeople", [])

        response = f"Batch Create Results for {user_google_email}:\n\n"
        response += f"Created {len(created_people)} contacts:\n\n"

        for item in created_people:
            person = item.get("person", {})
            response += _format_contact(person) + "\n\n"

        logger.info(
            f"Batch created {len(created_people)} contacts for {user_google_email}"
        )
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("batch_update_contacts", service_type="people")
async def batch_update_contacts(
    service: Resource,
    user_google_email: str,
    updates: List[Dict[str, str]],
) -> str:
    """
    Update multiple contacts in a batch operation.

    Args:
        user_google_email (str): The user's Google email address. Required.
        updates (List[Dict[str, str]]): List of update dictionaries with fields:
            - contact_id: The contact ID to update (required)
            - given_name: New first name
            - family_name: New last name
            - email: New email address
            - phone: New phone number
            - organization: New company name
            - job_title: New job title

    Returns:
        str: Confirmation with updated contacts.
    """
    logger.info(
        f"[batch_update_contacts] Invoked. Email: '{user_google_email}', Count: {len(updates)}"
    )

    try:
        if not updates:
            raise Exception("At least one update must be provided.")

        if len(updates) > 200:
            raise Exception("Maximum 200 contacts can be updated in a batch.")

        # First, fetch all contacts to get their etags
        resource_names = []
        for update in updates:
            contact_id = update.get("contact_id")
            if not contact_id:
                raise Exception("Each update must include a contact_id.")
            if not contact_id.startswith("people/"):
                contact_id = f"people/{contact_id}"
            resource_names.append(contact_id)

        # Batch get contacts for etags
        batch_get_result = await asyncio.to_thread(
            service.people()
            .getBatchGet(
                resourceNames=resource_names,
                personFields="metadata",
            )
            .execute
        )

        etags = {}
        for response in batch_get_result.get("responses", []):
            person = response.get("person", {})
            resource_name = person.get("resourceName")
            etag = person.get("etag")
            if resource_name and etag:
                etags[resource_name] = etag

        # Build batch update body
        update_bodies = []
        update_fields_set: set = set()

        for update in updates:
            contact_id = update.get("contact_id", "")
            if not contact_id.startswith("people/"):
                contact_id = f"people/{contact_id}"

            etag = etags.get(contact_id)
            if not etag:
                logger.warning(f"No etag found for {contact_id}, skipping")
                continue

            body = _build_person_body(
                given_name=update.get("given_name"),
                family_name=update.get("family_name"),
                email=update.get("email"),
                phone=update.get("phone"),
                organization=update.get("organization"),
                job_title=update.get("job_title"),
            )

            if body:
                body["resourceName"] = contact_id
                body["etag"] = etag
                update_bodies.append({"person": body})

                # Track which fields are being updated
                if "names" in body:
                    update_fields_set.add("names")
                if "emailAddresses" in body:
                    update_fields_set.add("emailAddresses")
                if "phoneNumbers" in body:
                    update_fields_set.add("phoneNumbers")
                if "organizations" in body:
                    update_fields_set.add("organizations")

        if not update_bodies:
            raise Exception("No valid update data provided.")

        batch_body = {
            "contacts": update_bodies,
            "updateMask": ",".join(update_fields_set),
            "readMask": DEFAULT_PERSON_FIELDS,
        }

        result = await asyncio.to_thread(
            service.people().batchUpdateContacts(body=batch_body).execute
        )

        update_results = result.get("updateResult", {})

        response = f"Batch Update Results for {user_google_email}:\n\n"
        response += f"Updated {len(update_results)} contacts:\n\n"

        for resource_name, update_result in update_results.items():
            person = update_result.get("person", {})
            response += _format_contact(person) + "\n\n"

        logger.info(
            f"Batch updated {len(update_results)} contacts for {user_google_email}"
        )
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("batch_delete_contacts", service_type="people")
async def batch_delete_contacts(
    service: Resource,
    user_google_email: str,
    contact_ids: List[str],
) -> str:
    """
    Delete multiple contacts in a batch operation.

    Args:
        user_google_email (str): The user's Google email address. Required.
        contact_ids (List[str]): List of contact IDs to delete.

    Returns:
        str: Confirmation message.
    """
    logger.info(
        f"[batch_delete_contacts] Invoked. Email: '{user_google_email}', Count: {len(contact_ids)}"
    )

    try:
        if not contact_ids:
            raise Exception("At least one contact ID must be provided.")

        if len(contact_ids) > 500:
            raise Exception("Maximum 500 contacts can be deleted in a batch.")

        # Normalize resource names
        resource_names = []
        for contact_id in contact_ids:
            if not contact_id.startswith("people/"):
                resource_names.append(f"people/{contact_id}")
            else:
                resource_names.append(contact_id)

        batch_body = {"resourceNames": resource_names}

        await asyncio.to_thread(
            service.people().batchDeleteContacts(body=batch_body).execute
        )

        response = f"Batch deleted {len(contact_ids)} contacts for {user_google_email}."

        logger.info(
            f"Batch deleted {len(contact_ids)} contacts for {user_google_email}"
        )
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("create_contact_group", service_type="people")
async def create_contact_group(
    service: Resource,
    user_google_email: str,
    name: str,
) -> str:
    """
    Create a new contact group (label).

    Args:
        user_google_email (str): The user's Google email address. Required.
        name (str): The name of the new contact group.

    Returns:
        str: Confirmation with the new group details.
    """
    logger.info(
        f"[create_contact_group] Invoked. Email: '{user_google_email}', Name: '{name}'"
    )

    try:
        body = {"contactGroup": {"name": name}}

        result = await asyncio.to_thread(
            service.contactGroups().create(body=body).execute
        )

        resource_name = result.get("resourceName", "")
        group_id = resource_name.replace("contactGroups/", "")
        created_name = result.get("name", name)

        response = f"Contact Group Created for {user_google_email}:\n\n"
        response += f"Name: {created_name}\n"
        response += f"ID: {group_id}\n"
        response += f"Type: {result.get('groupType', 'USER_CONTACT_GROUP')}\n"

        logger.info(f"Created contact group '{name}' for {user_google_email}")
        return response

    except HttpError as error:
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("update_contact_group", service_type="people")
async def update_contact_group(
    service: Resource,
    user_google_email: str,
    group_id: str,
    name: str,
) -> str:
    """
    Update a contact group's name.

    Args:
        user_google_email (str): The user's Google email address. Required.
        group_id (str): The contact group ID to update.
        name (str): The new name for the contact group.

    Returns:
        str: Confirmation with updated group details.
    """
    # Normalize resource name
    if not group_id.startswith("contactGroups/"):
        resource_name = f"contactGroups/{group_id}"
    else:
        resource_name = group_id

    logger.info(
        f"[update_contact_group] Invoked. Email: '{user_google_email}', Group: {resource_name}"
    )

    try:
        body = {"contactGroup": {"name": name}}

        result = await asyncio.to_thread(
            service.contactGroups()
            .update(resourceName=resource_name, body=body)
            .execute
        )

        updated_name = result.get("name", name)

        response = f"Contact Group Updated for {user_google_email}:\n\n"
        response += f"Name: {updated_name}\n"
        response += f"ID: {group_id}\n"

        logger.info(f"Updated contact group {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact group not found: {group_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("delete_contact_group", service_type="people")
async def delete_contact_group(
    service: Resource,
    user_google_email: str,
    group_id: str,
    delete_contacts: bool = False,
) -> str:
    """
    Delete a contact group.

    Args:
        user_google_email (str): The user's Google email address. Required.
        group_id (str): The contact group ID to delete.
        delete_contacts (bool): If True, also delete contacts in the group (default: False).

    Returns:
        str: Confirmation message.
    """
    # Normalize resource name
    if not group_id.startswith("contactGroups/"):
        resource_name = f"contactGroups/{group_id}"
    else:
        resource_name = group_id

    logger.info(
        f"[delete_contact_group] Invoked. Email: '{user_google_email}', Group: {resource_name}"
    )

    try:
        await asyncio.to_thread(
            service.contactGroups()
            .delete(resourceName=resource_name, deleteContacts=delete_contacts)
            .execute
        )

        response = f"Contact group {group_id} has been deleted for {user_google_email}."
        if delete_contacts:
            response += " Contacts in the group were also deleted."
        else:
            response += " Contacts in the group were preserved."

        logger.info(f"Deleted contact group {resource_name} for {user_google_email}")
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact group not found: {group_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)


@server.tool()
@require_google_service("people", "contacts")
@handle_http_errors("modify_contact_group_members", service_type="people")
async def modify_contact_group_members(
    service: Resource,
    user_google_email: str,
    group_id: str,
    add_contact_ids: Optional[List[str]] = None,
    remove_contact_ids: Optional[List[str]] = None,
) -> str:
    """
    Add or remove contacts from a contact group.

    Args:
        user_google_email (str): The user's Google email address. Required.
        group_id (str): The contact group ID.
        add_contact_ids (Optional[List[str]]): Contact IDs to add to the group.
        remove_contact_ids (Optional[List[str]]): Contact IDs to remove from the group.

    Returns:
        str: Confirmation with results.
    """
    # Normalize resource name
    if not group_id.startswith("contactGroups/"):
        resource_name = f"contactGroups/{group_id}"
    else:
        resource_name = group_id

    logger.info(
        f"[modify_contact_group_members] Invoked. Email: '{user_google_email}', Group: {resource_name}"
    )

    try:
        if not add_contact_ids and not remove_contact_ids:
            raise Exception(
                "At least one of add_contact_ids or remove_contact_ids must be provided."
            )

        body: Dict[str, Any] = {}

        if add_contact_ids:
            # Normalize resource names
            add_names = []
            for contact_id in add_contact_ids:
                if not contact_id.startswith("people/"):
                    add_names.append(f"people/{contact_id}")
                else:
                    add_names.append(contact_id)
            body["resourceNamesToAdd"] = add_names

        if remove_contact_ids:
            # Normalize resource names
            remove_names = []
            for contact_id in remove_contact_ids:
                if not contact_id.startswith("people/"):
                    remove_names.append(f"people/{contact_id}")
                else:
                    remove_names.append(contact_id)
            body["resourceNamesToRemove"] = remove_names

        result = await asyncio.to_thread(
            service.contactGroups()
            .members()
            .modify(resourceName=resource_name, body=body)
            .execute
        )

        not_found = result.get("notFoundResourceNames", [])
        cannot_remove = result.get("canNotRemoveLastContactGroupResourceNames", [])

        response = f"Contact Group Members Modified for {user_google_email}:\n\n"
        response += f"Group: {group_id}\n"

        if add_contact_ids:
            response += f"Added: {len(add_contact_ids)} contacts\n"
        if remove_contact_ids:
            response += f"Removed: {len(remove_contact_ids)} contacts\n"

        if not_found:
            response += f"\nNot found: {', '.join(not_found)}\n"
        if cannot_remove:
            response += f"\nCannot remove (last group): {', '.join(cannot_remove)}\n"

        logger.info(
            f"Modified contact group members for {resource_name} for {user_google_email}"
        )
        return response

    except HttpError as error:
        if error.resp.status == 404:
            message = f"Contact group not found: {group_id}"
            logger.warning(message)
            raise Exception(message)
        message = f"API error: {error}. You might need to re-authenticate. LLM: Try 'start_google_auth' with the user's email ({user_google_email}) and service_name='Google Contacts'."
        logger.error(message, exc_info=True)
        raise Exception(message)
    except Exception as e:
        message = f"Unexpected error: {e}."
        logger.exception(message)
        raise Exception(message)
