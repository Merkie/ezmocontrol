export function buildCharacterSwapPrompt(
  frameDimensions: { width: number; height: number },
  characterDimensions: { width: number; height: number }
): string {
  const fw = frameDimensions.width;
  const fh = frameDimensions.height;
  const cw = characterDimensions.width;
  const ch = characterDimensions.height;

  return `Look at Image 1 (frame.png, ${fw}x${fh}) and Image 2 (character.png, ${cw}x${ch}).

Image 1 is the SOURCE FRAME. Image 2 is the REPLACEMENT CHARACTER.

Your task: Replace the person/character in Image 1 with the character from Image 2.

RULES:
- OUTPUT DIMENSIONS: The final image MUST match the exact dimensions and aspect ratio of Image 1 (${fw}x${fh}). Image 2 is only a character reference — do not adopt its dimensions, aspect ratio, or framing in any way.
- The background, environment, lighting, and camera angle from Image 1 must remain completely unchanged.
- Match the exact pose, body position, and orientation of the person in Image 1.
- The replacement character must retain their own appearance fully — their face, hair, skin, clothing, accessories, and style as shown in Image 2. Do not transfer any visual traits from the Image 1 person onto the replacement character.
- Scale the replacement character naturally to fit the scene in Image 1.
- Maintain consistent lighting and shadows so the replacement character looks like they belong in the original scene.
- The final output should look like a single natural photograph or frame where the Image 2 character was always in that scene, in that pose.`;
}
