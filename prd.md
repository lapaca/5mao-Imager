# GPTimage2 Personal Drawing Tool PRD

## 1. Product Overview

### 1.1 Product Positioning

GPTimage2 Personal Drawing Tool is a web-based AI drawing application designed for individual use. The product features a minimalist, light-themed, modern interface that wraps the third-party GPTimage2 image generation API into a visual UI. This allows users with no programming background to easily perform text-to-image and image-to-image generations.

### 1.2 Core Value

- Translates abstract API parameters into intuitive forms, upload areas, dimension dropdowns, and generation buttons.
- Supports saving API configurations within the browser, eliminating the need to re-enter them after refreshing the page.
- Features generation result previews, history logs, manual downloads, and automatic local saving (upon authorization).
- Maintains a pure frontend architecture without introducing a public backend server or collecting users' API Keys.

### 1.3 Target Users

Target users include individual creators, design explorers, wallpaper makers, and users who want to quickly generate or redraw images via GPTimage2 without writing code.

### 1.4 MVP Scope

The MVP includes API configuration, text-to-image, image-to-image, output preview, history logs, manual downloading, and automatic local saving after authorization.

The MVP does NOT include user login, multi-user collaboration, cloud galleries, batch generation, backend proxies, payment management, model switching, image editors, or complex workflow orchestration.

## 2. Product Architecture & Page Layout

### 2.1 Page Format

The product is a pure frontend Single Page Web App (SPA). The page defaults to a split-pane layout:

- **Left Console**: Houses API configuration access, mode switching (Tabs), prompts, dimensions, upload area, sliders, and the generation button.
- **Right Canvas**: Displays the currently generated image, history logs, save status, download button, and error prompts.

### 2.2 Visual Style

- Default theme is light and minimalist.
- Background is predominantly off-white, maintaining clear boundaries for form areas.
- The right canvas uses a light gray background, with the generated image centered.
- Buttons, input fields, and Tabs follow a modern utility-web style, prioritizing clarity and usability.

### 2.3 Information Architecture

The page mainly consists of the following modules:

- API Configuration Module
- Text-to-Image Module
- Image-to-Image Module
- Output Preview Module
- History Log Module
- Local Save & Download Module
- Error Prompt Module

## 3. User Flow

### 3.1 Initial API Configuration

1. User opens the webpage.
2. An "API Settings" button is displayed at the top right or top left of the page.
3. User clicks the "API Settings" button, opening the settings panel or modal.
4. User enters the API Key and Base URL.
5. User clicks "Save & Confirm".
6. The system saves the configuration to the browser's `localStorage`.
7. The settings panel closes, and the user can immediately start generating images.

If a user clicks "Generate" without configuring the API Key or Base URL, the system should prompt "Please complete API configuration first" and guide them to open the settings panel.

### 3.2 Text-to-Image

1. User selects the "Text-to-Image" Tab.
2. User enters the positive prompt.
3. User optionally enters a negative prompt.
4. User selects the image dimensions.
5. User clicks "Generate Image".
6. The system enters a loading state; the button displays "Generating..." and shows a loading animation.
7. Upon a successful API response, the generated image is displayed on the right canvas.
8. A new generation record is added to the history log.
9. If the user has authorized a save folder, the system automatically saves the image to that folder.

### 3.3 Image-to-Image

1. User selects the "Image-to-Image" Tab.
2. User clicks the upload area or drag-and-drops a local base image.
3. The system validates the file type and size.
4. User enters the modification prompt.
5. User adjusts the denoising strength slider.
6. User selects the image dimensions.
7. User clicks "Generate Image".
8. The system sends the base image and parameters via `multipart/form-data`.
9. Upon a successful API response, the new image is displayed on the right canvas and logged in history.

### 3.4 Viewing History & Saving

1. Upon successful generation, the image enters the history list on the right.
2. Users can click on history thumbnails to switch the large preview on the right canvas.
3. Users can click the "Download Image" button to manually save the current image.
4. If the user has authorized a save folder via the browser, the system automatically saves the image upon successful generation and displays the save status in the history log.

## 4. Functional Requirements

### 4.1 API Configuration Module

#### 4.1.1 Access

- Provide an "API Settings" button at the top right or top left of the page.
- The button should always be visible so users can modify the API Key and Base URL at any time.
- When unconfigured, the button should have a clear indicator, such as "Unconfigured" or a lightweight warning icon.

#### 4.1.2 Settings Panel

The settings panel contains the following fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| API Key | Password Input | Yes | Third-party GPTimage2 API Key; characters hidden by default |
| Base URL | Text Input | Yes | Third-party API root address, e.g., `https://cc-vibe.com` |
| Show/Hide Key | Button | No | Toggles API Key plaintext visibility |
| Save & Confirm | Button | Yes | Validates and saves config to `localStorage` |
| Test Connection | Button | No | Optional feature to verify if the current config is valid |

#### 4.1.3 Save Rules

- API Key and Base URL are saved to the browser's `localStorage`.
- Configurations persist after page refreshes.
- Configurations are saved ONLY locally on the user's browser and are NEVER uploaded to any public server.
- The Base URL should have trailing slashes removed upon saving to avoid double slashes in request paths.

#### 4.1.4 Form Validation

- If API Key is empty, disable saving and prompt "Please enter API Key".
- If Base URL is empty, disable saving and prompt "Please enter Base URL".
- If Base URL format is visibly invalid, prompt "Please enter a valid Base URL".

### 4.2 Text-to-Image Module

#### 4.2.1 Form Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| Positive Prompt | Textarea | Yes | Empty | Describes the desired image |
| Negative Prompt | Textarea | No | Empty | Describes what should be avoided |
| Image Dimensions | Dropdown | Yes | `1320x2868` | Selects output image size |

#### 4.2.2 Generation Behavior

- API configuration and positive prompt must be validated before clicking "Generate Image".
- Disable the generation button during the request.
- Change button text to "Generating..." during the request.
- Update the right-side large preview and history log upon success.
- Retain user inputs and display the error reason upon failure.

#### 4.2.3 Prompt Merging Rules

The final `prompt` sent to the API for Text-to-Image is composed of the positive prompt, negative prompt, and necessary supplementary instructions.

Example:

```text
{Positive Prompt}

Avoid: {Negative Prompt}
```

If the negative prompt is empty, only the positive prompt is sent.

### 4.3 Image-to-Image Module

#### 4.3.1 Upload Area

- Supports click-to-upload.
- Supports drag-and-drop upload.
- Supports PNG, JPG, JPEG, and WebP.
- Maximum single file size: 25MB.
- Displays a preview of the base image upon successful upload.
- Replaces the current base image when a new one is uploaded.

#### 4.3.2 Form Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| Base Image | Image Upload | Yes | Empty | Original image used for Image-to-Image |
| Modification Prompt | Textarea | Yes | Empty | Describes the modification goals for the base image |
| Denoising Strength | Slider | Yes | `0.5` | Range `0.0` to `1.0` |
| Image Dimensions | Dropdown | Yes | `1320x2868` | Selects output image size |

#### 4.3.3 Denoising Strength Handling

The current API example does not provide an independent `denoising_strength` field. Therefore, denoising strength is not sent as an independent field but merged into the prompt.

Merging rules:

```text
{Modification Prompt}

Denoising strength guidance: {Denoising Strength}. 0 means preserve the original image as much as possible, 1 means regenerate with maximum freedom.
```

If the user enters negative constraints, append them to the prompt:

```text
Avoid: {Negative Prompt or system-generated restriction description}
```

### 4.4 Image Dimension Presets

The dimension dropdown is displayed as "Use Case + Size". `1320x2868` is selected by default, targeting iOS vertical wallpapers.

| Category | Display Text | Size Value |
| --- | --- | --- |
| Avatar/Square | 1:1 Avatar - 1024 | `1024x1024` |
| Avatar/Square | 1:1 HD Square - 2048 | `2048x2048` |
| Mobile Wallpaper | 9:16 Mobile - 1080p | `1080x1920` |
| Mobile Wallpaper | iOS Vertical | `1320x2868` |
| Mobile Wallpaper | 2K Vertical | `1440x2560` |
| Mobile Wallpaper | 4K Vertical | `2160x3840` |
| PC Wallpaper | 16:9 Desktop - 1080p | `1920x1080` |
| PC Wallpaper | 16:9 Desktop - 2K | `2560x1440` |
| PC Wallpaper | 16:9 Desktop - 4K | `3840x2160` |
| Social Vertical | 4:5 Social Vertical | `1080x1350` |
| Social Vertical | 3:4 Social Vertical | `1080x1440` |

If the GPTimage2 service provider does not support certain dimensions, they should be removed from the dropdown or marked as unavailable during development.

### 4.5 Output Preview Module

#### 4.5.1 Empty State

When no image is generated, the right canvas displays an empty state message, e.g., "Generated images will be displayed here."

#### 4.5.2 Success State

Upon successful generation:

- Display the large version of the latest generated image.
- Display image dimensions.
- Display generation mode: Text-to-Image or Image-to-Image.
- Display generation time.
- Display the "Download Image" button.
- If auto-saved, display the successful save status.

#### 4.5.3 Loading State

During the request:

- The right canvas displays a loading prompt.
- The current generation button is disabled.
- Do NOT clear existing results, preventing users from losing the previous result upon failure.

### 4.6 History Log Module

#### 4.6.1 History Content

Each history record contains:

| Field | Description |
| --- | --- |
| id | Unique ID generated locally |
| imageUrl | Image URL returned by the API |
| mode | `text-to-image` or `image-to-image` |
| prompt | User's primary prompt |
| size | Image dimensions |
| createdAt | Generation timestamp |
| saved | Whether it was auto-saved to the authorized folder |
| fileName | Auto-save or suggested download filename |

#### 4.6.2 Persistence

- History logs are saved to `localStorage`.
- History remains viewable after page refreshes.
- History saves image URLs, NOT image binaries.
- If a URL expires, the history item is retained, but the image may fail to preview.

#### 4.6.3 Display

- History records are displayed as a thumbnail list below or beside the right canvas.
- Clicking a history item switches the right-side large preview to that record.
- The currently selected history item should have a highlighted state.

### 4.7 Local Save & Download Module

#### 4.7.1 Manual Download

- A "Download Image" button is provided below each generated image.
- Clicking it downloads the current image to the user's browser default download directory.
- Download filenames use a unified naming convention.

#### 4.7.2 Auto-Save

Auto-save relies on the browser's File System Access API.

User Flow:

1. User clicks "Select Save Folder".
2. Browser pops up a folder authorization picker.
3. User selects a local folder and authorizes access.
4. For all subsequent successful generations, the system automatically saves the image to the authorized folder.
5. The history log displays the save status for that image.

Compatibility Strategy:

- Prioritize Chrome/Edge for auto-save support.
- Browsers that do not support the File System Access API will display a fallback notice.
- After fallback, users can still manually save images using the "Download Image" button.

#### 4.7.3 File Naming Convention

File naming format:

```text
gptimage2-{mode}-{YYYYMMDD-HHmmss}.png
```

Examples:

```text
gptimage2-text-20260602-173012.png
gptimage2-image-20260602-173245.png
```

Where:

- `text` indicates Text-to-Image.
- `image` indicates Image-to-Image.
- Time uses the user's local time.
- A short ID can be appended for multiple generations within the same second to avoid overwriting.

## 5. API Integration Specifications

### 5.1 Authentication

All requests use a Bearer Token:

```http
Authorization: Bearer {API_KEY}
```

### 5.2 Text-to-Image API

Request:

```http
POST {Base URL}/images/generations
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

Request Body:

```json
{
  "model": "gpt-image-2",
  "prompt": "A cute orange cat playing with yarn, studio ghibli style",
  "n": 1,
  "size": "1320x2868"
}
```

### 5.3 Image-to-Image API

Request:

```http
POST {Base URL}/images/edits
Content-Type: multipart/form-data
Authorization: Bearer {API_KEY}
```

FormData Fields:

| Field | Value |
| --- | --- |
| model | `gpt-image-2` |
| prompt | Merged modification prompt |
| n | `1` |
| size | User-selected dimensions |
| image | User-uploaded base image file |

### 5.4 Response Parsing

API responses prioritize URLs:

```json
{
  "data": [
    {
      "url": "https://example.com/generated-image.png"
    }
  ]
}
```

The frontend reads `data[0].url` as the source for image previews, history logs, and downloads.

If service providers return base64 in the future, support can be extended for `data[0].b64_json`, but it is NOT required for the MVP.

### 5.5 CORS Prerequisites

Since the product is a pure frontend application, the browser will request the GPTimage2 API directly. The third-party service provider must allow Cross-Origin Resource Sharing (CORS) for the corresponding web origin; otherwise, requests will be blocked by the browser.

The PRD does not include a backend proxy solution. If CORS restrictions are encountered, the MVP will only display an error prompt and will not bypass browser security restrictions.

## 6. Error Handling

### 6.1 Form Errors

| Scenario | Prompt |
| --- | --- |
| API Key not filled | Please enter your API Key |
| Base URL not filled | Please enter the Base URL |
| Positive Prompt not filled | Please enter an image description |
| Base Image not uploaded | Please upload a base image first |
| Unsupported file format | Only PNG, JPG, JPEG, and WebP are supported |
| File exceeds 25MB | Image size cannot exceed 25MB |

### 6.2 API Errors

| Scenario | Prompt Strategy |
| --- | --- |
| Invalid API Key | Display API return message, add prompt to check API Key |
| Insufficient Balance | Display API return message, add prompt to check account balance |
| Unsupported Dimensions | Prompt that current size is unavailable, suggest changing size |
| Network Failure | Prompt network request failed, please check network or Base URL |
| CORS Failure | Prompt that the API does not support browser cross-origin access |
| Timeout | Prompt generation timed out, please try again later |

### 6.3 Error Display Method

- Errors should be prioritized for inline display in red text.
- Severe errors can use lightweight modals or toasts.
- Do NOT clear user inputs when an error occurs.
- Retain the last successfully generated image when an error occurs.

## 7. Non-Functional Requirements

### 7.1 Security

- API Keys are stored exclusively in the user browser's `localStorage`.
- The page must NOT send the API Key to any address other than the user-configured Base URL.
- API Key input fields should have characters hidden by default.
- The PRD explicitly states that `localStorage` is not encrypted storage; it is suitable for personal local use but not for shared devices.

### 7.2 Compatibility

- Core image generation features target modern desktop browsers.
- The auto-save feature primarily targets Chrome/Edge.
- Browsers like Safari/Firefox that do not support folder authorization will fallback to manual downloads.

### 7.3 Performance

- Maximum upload file size is 25MB.
- Prevent duplicate clicks during requests to avoid concurrent generations.
- History logs save URLs and metadata, not image binaries, reducing `localStorage` pressure.

### 7.4 Maintainability

- API Base URL, API Key, dimension lists, and history logs should have clear data structures.
- API request logic should be decoupled from UI form logic to facilitate future service provider replacements.
- Prompt merging rules should be centrally maintained to avoid scattered implementations for Text-to-Image and Image-to-Image.

## 8. Acceptance Criteria

### 8.1 API Configuration

- The UI can be accessed upon first visit even if the API is unconfigured.
- Clicking the "API Settings" button allows input of the API Key and Base URL.
- The API Key is hidden by default and can be toggled to show/hide.
- Clicking "Save & Confirm" writes the configuration to `localStorage`.
- The API Key and Base URL persist after refreshing the page.
- If the API is unconfigured, clicking generate prompts the user to complete API configuration first.

### 8.2 Text-to-Image

- Users can initiate a Text-to-Image request after entering a positive prompt and selecting dimensions.
- The request URL is `{Base URL}/images/generations`.
- The request body contains `model: "gpt-image-2"`, the merged `prompt`, `n: 1`, and `size`.
- The button displays "Generating..." and is disabled during the request.
- Upon success, the image is displayed on the right and added to the history log.

### 8.3 Image-to-Image

- Users can click or drag-and-drop to upload PNG/JPG/WebP base images.
- Files exceeding 25MB are rejected with a prompt.
- The request URL is `{Base URL}/images/edits`.
- The request format is `multipart/form-data`.
- The request includes the base image file, model, merged prompt, quantity, and dimensions.
- Upon success, the image is displayed on the right and added to the history log.

### 8.4 History Log

- A new history record is added after each successful generation.
- History logs display thumbnails, mode, dimensions, and generation time.
- Clicking a history record switches the large preview.
- History records persist after page refreshes.
- If a history image URL becomes invalid, the page should display a placeholder or error state.

### 8.5 Auto-Save & Download

- Users can select and authorize a save folder.
- After authorization, images are automatically saved upon successful generation.
- Auto-save filenames follow the `gptimage2-{mode}-{YYYYMMDD-HHmmss}.png` format.
- Browsers not supporting auto-save can use the "Download Image" button.
- Multiple images generated within the same second will not overwrite each other.

### 8.6 Error Handling

- Invalid API Key, insufficient balance, unsupported dimensions, network failures, CORS failures, timeouts, etc., should display user-friendly prompts.
- User inputs are not cleared after an error.
- The previous successfully generated image is not cleared after an error.

## 9. Suggested Data Structures

### 9.1 Local Configuration

```json
{
  "apiKey": "user-api-key",
  "baseUrl": "https://cc-vibe.com"
}
```

### 9.2 History Log

```json
{
  "id": "local-generated-id",
  "imageUrl": "https://example.com/generated-image.png",
  "mode": "text-to-image",
  "prompt": "A cinematic city wallpaper",
  "size": "1320x2868",
  "createdAt": "2026-06-02T17:30:12.000Z",
  "saved": true,
  "fileName": "gptimage2-text-20260602-173012.png"
}
```

## 10. Confirmed Assumptions

- The GPTimage2 service provider supports cross-origin requests; otherwise, a pure frontend solution cannot connect directly.
- The GPTimage2 service provider supports the dimensions listed in the PRD; if the API rejects certain dimensions, they will be removed or marked unavailable during development.
- The API response prioritizes using `data[0].url`.
- The API Key and Base URL are stored ONLY locally in the user's browser and are NEVER uploaded to any public server.
- History logs save URLs rather than image binaries; if URLs expire, history items are retained but images may fail to preview.
- Auto-save relies on Chrome/Edge's File System Access API; other browsers gracefully fallback to manual download.
- The MVP does NOT include login, multi-user support, cloud galleries, batch generation, backend proxies, payment management, or model switching.
