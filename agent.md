AI Image Editing Tool — Development Conventions
A web-based image editing tool: users input a third-party AI service API key, upload images, and generate/modify images via API.
This is a small-to-medium-sized project. The goal is to keep it simple, reliable, and easy to maintain without over-engineering.

Core Principles
Keep code simple and direct: Avoid abstraction whenever possible. Do not design ahead for things that "might be needed in the future" (YAGNI).

Single Source of Truth for state: Keep state sources singular and clear. Do not store the exact same data in multiple places.

Handle all API states: Every API call must explicitly handle four scenarios: loading, success, failure, and timeout.

Ask, don't guess: If you are unsure about the request/response format of an API, ask first. Do not fabricate or guess.

API Key Security (Crucial)
The key is private user information. It must never be printed in logs, appended to URLs, or committed to the code repository.

Prefer a backend proxy to forward requests, avoiding exposing the key directly in the browser. If it must be a pure frontend solution, you must explicitly tell the user where the key is stored and what the risks are.

Be explicit about where the key is stored (memory vs. localStorage). Do not default on behalf of the user; confirm first.

Asynchronous Requests (Crucial)
Image generation is asynchronous and prone to issues. You must ensure the following:

Prevent duplicate submissions: Disable the submit button while a request is in progress.

Prevent stale result overrides (Race conditions): If a user clicks twice rapidly, the result of the older request must not overwrite the newer one. Use AbortController to cancel the previous request, or ignore stale responses.

Fallbacks for timeouts and failures: Set a timeout duration and provide clear UI prompts upon failure. Never leave the user with an infinite loading spinner.

No fire-and-forget: Requests must be cancellable (e.g., when the component unmounts or when the user switches images).

Image Processing
Images consume significant memory. Keep in mind:

Memory leaks: If you use URL.createObjectURL, you must call URL.revokeObjectURL when it's no longer needed.

Use thumbnails or compressed images for previews. Do not retain full-resolution original images everywhere in memory.

Do not block the main thread when processing large images. Use Canvas or Web Workers when necessary.

Error Handling
Treat data returned from third parties as untrusted. Perform basic validation before rendering.

Provide users with clear error messages (e.g., invalid key, insufficient quota, network error, timeout). Do not just console.log errors.

Things to Avoid
Unnecessary global states, singletons, or abstraction layers.

Storing copies of the same state in multiple places, leading to inconsistency.

"Happy-path only" code that pretends to work but fails to handle errors and cancellations.

Guessing when unsure. Ask instead,DO NOT INVENT!