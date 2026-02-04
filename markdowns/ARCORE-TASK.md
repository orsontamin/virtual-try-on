Project Instruction: AR Face Filter for Virtual Makeup (ARCore)
1. Objective
Build a real-time Virtual Makeup application using Google ARCore (or MediaPipe Face Landmarker for Web). The app must allow users to select different makeup styles (Lipstick, Eyeshadow, Blush) and see them applied to their face in real-time via the camera.

2. Tech Stack Requirements
Engine: MediaPipe Face Landmarker (Web/Javascript) or ARCore Augmented Faces (Native Android). Note: For immediate web deployment, MediaPipe is recommended.

Graphics: Three.js or HTML5 Canvas for overlaying 2D textures on the 3D face mesh.

Assets: Transparent PNG textures mapped to the standard 468-point face mesh.

3. Implementation Task List
Task 1: Initialize Face Tracking
Set up the camera feed.

Initialize the Face Landmarker to track 468 3D facial landmarks.

Configure the tracker for real-time performance (low latency).

Task 2: Create the Makeup Overlay Logic
Lips (Lipstick): Identify landmarks 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291 (outer) and apply a color fill or a PNG texture with multiply blend mode.

Eyes (Eyeshadow): Map textures to the eyelid regions.

Cheeks (Blush): Define the coordinate bounds for the cheekbones.

Task 3: Interactive UI (Makeup Selector)
Create a horizontal scrollable menu with 5 makeup style "presets."

Implement a switchStyle(styleID) function that:

Clears the current texture.

Loads the new PNG overlay from a local directory or Google Cloud Storage.

Updates the opacity/strength based on user preference.

4. Asset Specifications (Makeup)
Provide instructions for the LLM to handle the following asset types:

UV Map: All textures must follow the canonical face mesh UV layout provided by Google.

Format: 1024x1024 .PNG with transparency.

Blending: Use globalAlpha for intensity control and context.globalCompositeOperation = 'multiply' for realistic skin blending.

5. Extension Placeholder: AI Barber (Phase 2)
Instruction to LLM: Ensure the architecture is modular.

Future logic: We will eventually add "Hair Segmentation" to isolate the hair area and apply a color-burn layer for hair dyeing or a 3D .GLB overlay for new hairstyles.

6. Optimization for 1,000 Users
Client-Side Processing: All AR tracking must happen on the user's device (Browser/App) to keep server costs at $0.

Final Snapshot: Include a function to capture the current frame + the makeup overlay and save it as a high-res JPEG.
