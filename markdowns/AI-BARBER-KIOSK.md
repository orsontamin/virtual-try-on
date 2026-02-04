💈 AI Barber Kiosk: "The Chair"

Technical Master Specification & System Architecture (v2.2)

🚀 1. Executive Summary

"The Chair" is a next-generation AI grooming consultation kiosk designed for luxury barbershops and premium retail environments. By leveraging a multimodal dual-engine pipeline, the system analyzes a user's facial morphology in real-time and provides a high-fidelity visual preview of professional hairstyle recommendations.

🛠 2. The Dual-Engine Architecture

Phase A: The Analyst (Gemini 1.5 Flash)

Role: Multimodal Vision & Consultation Logic.

Capability: Analyzes high-resolution frontal photography to identify 100+ facial landmarks.

Logical Tasks:

Geometric Classification: Detects face shape (Oval, Square, Round, Heart, Diamond, Oblong).

Texture Analysis: Estimates hair density (Thin, Medium, Thick) and type (Straight 1, Wavy 2, Curly 3, Coily 4).

Constraint Mapping: Identifies cowlicks, receding hairlines, or forehead height to filter out unfeasible styles.

Phase B: The Mirror (Imagen 3)

Role: Identity-Preserving Image-to-Image (i2i) Synthesis.

Capability: Performs a controlled diffusion process on the original user selfie.

Fidelity Target: 8K resolution, maintaining 100% of the user's skin tone, eye color, and bone structure while seamlessly applying the "Trendsetter" hairstyle.

Control Mechanism: Uses a reference_image and mask_guidance to ensure only the hair region is modified.

📐 3. Facial Morphology Metrics

The system evaluates the following dimensions to generate recommendations:

Face Shape (The Foundation):

Square: Strong jawline; width of forehead and jaw are nearly equal.

Oval: Length is 1.5x the width; soft curves.

Heart: Wide forehead, narrow chin.

Facial Features:

Forehead Height: Determines if a "fringe" or "fringe-less" look is optimal.

Ear Protrusion: Suggests side-volume or tapered finishes.

Jawline Sharpness: Determines the "Drop" angle of the fade.

📋 4. The "Three-Look" Framework

Every user receives exactly three technical paths tailored to their geometry:

Path

Name

Philosophy

Key Styles

01

The Trendsetter

High-contrast, fashion-forward, requires daily styling.

Mid-Drop Burst Fade, Textured Crop, Modern Mullet.

02

The Professional

Classic, symmetrical, office-appropriate.

Tapered Quiff, Executive Side-Part, Ivy League.

03

Low Maintenance

Minimal product required, maximum longevity between cuts.

3-2-1 Buzz Fade, High & Tight, Caesar Cut.

💻 5. System Data Schema (JSON Output)

To ensure the UI can parse Gemini's analysis, the model is instructed to return data in this format:

{
  "analysis": {
    "face_shape": "Square",
    "hair_type": "Wavy (2B)",
    "notable_features": ["High cheekbones", "Widow's peak"]
  },
  "recommendations": [
    {
      "category": "Trendsetter",
      "style_name": "Textured Crop with Skin Fade",
      "rationale": "The fringe balances the high forehead while the skin fade accentuates the sharp jawline.",
      "barber_notes": {
        "sides": "#0 guard blended into a skin taper",
        "top": "2.5 inches, point-cut for texture",
        "product": "Matte clay"
      }
    }
    // ... repeated for Professional and Low Maintenance
  ]
}


🔄 6. The User Experience (UX) Journey

The Approach: User triggers the kiosk via proximity sensor.

The Capture: A high-definition frontal portrait is captured with "Studio Lighting" UI prompts.

The Processing:

Gemini generates the analysis and technical notes (Approx. 2s).

Imagen generates the photorealistic "Trendsetter" preview (Approx. 6s).

The Reveal: A split-screen interface shows the "Current Self" vs. the "AI Mirror Style."

The Hand-off: User selects a style and scans a QR code. This generates a Digital Barber Card on their mobile device containing the professional technical notes.

📝 7. Barber’s Technical Glossary

The system is tuned to use professional terminology for real-world application:

Fades: Skin, Shadow, Drop, Burst, or Temple.

Guard Sizes: #0 (Skin) up to #4 (1/2 inch).

Techniques: Point-cutting (for texture), Slithering (for thinning), Over-comb (for blending).

Lines: C-wash, Nape-taper, Hard-part.

🔒 8. Security, Privacy & Ethics

Identity Guard: The system utilizes Vertex AI safety filters to prevent any non-human or non-hair related generations.

Local Logic: Authentication and session tokens are managed via Google Cloud Identity.

Zero-Persistence: In "Guest Mode," all biometric data and photos are wiped from the buffer within 60 seconds of session completion.

Powered by EventzFlow AI & Google Vertex AI (2026)