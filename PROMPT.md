# EzMoControl plan

This project is designed to create a simple interface for working with Kling Motion Control. Here's an example:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/v3/pro/motion-control", {
  input: {
    prompt: "A man sitting at a desk chair",
    elements: null,
    image_url: "https://v3b.fal.media/files/b/0a...9f/Blr...2W_frame2.png",
    video_url: "https://v3b.fal.media/files/b/0a...9f/GK_...Hw_movie.mp4",
    keep_original_sound: true,
    character_orientation: "image",
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```

The output is this:

```json
{
  "video": {
    "url": "https://v3b.fal.media/files/b/0a9...c3/2e5...ut.mp4",
    "file_name": "output.mp4",
    "file_size": 19239444,
    "content_type": "video/mp4"
  }
}
```

So that final URL is the output we are trying to make. The thing is though is that the image needs to be generated first (the video is uploaded by the user).

The video will be a .mp4 file. We need to take the first frame of that video and use it as the image input for the motion control. But before we do that, we need to process it with nano banana 2 in order to change the character in the image to the desired character.

So to start the job, the user will uploaded these things:

1. Their video (must be 10 seconds or less, this is FAL's requirement)
2. The character image they want to be (can be any size)

So an example of this would be like I record a video of myself dancing, then I upload a picture of spiderman.

What would then happen is it would take the first frame of that input video of me dancing, then it would process that with nano banana pro like this (it would need to generate a custom prompt as well, or at least change the image details in this one to fit the current set)

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: "Look at Image 1 (movie_frame.png, 1620x1080) and Image 2 (Dwight_Schrute.jpg, 265x375).

  Image 1 is the SOURCE FRAME. Image 2 is the REPLACEMENT CHARACTER.

  Your task: Replace the person/character in Image 1 with the character from Image 2.

  RULES:
  - The background, environment, lighting, and camera angle from Image 1 must remain completely unchanged.
  - Match the exact pose, body position, and orientation of the person in Image 1.
  - The replacement character must retain their own appearance fully — their face, hair, skin, clothing, accessories, and style as shown in Image 2. Do not transfer any visual traits from the Image 1 person onto the replacement character.
  - Scale the replacement character naturally to fit the scene in Image 1.
  - Maintain consistent lighting and shadows so the replacement character looks like they belong in the original scene.
  - The final output should look like a single natural photograph or frame where the Image 2 character was always in that scene, in that pose.",
    image_urls: ["https://v3b.fal.media/files/b/0a9...8a/Y6YX...vie_frame.png", "https://v3b.fal.media/files/b/0a...68a/-V1gXg...hrute.jpg"],
    num_images: 1,
    resolution: "1K",
    aspect_ratio: "auto",
    output_format: "png"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```

Nano Banana output:

```json
{
  "images": [
    {
      "url": "https://v3b.fal.media/files/b/0a9...8a/5QvCRI...cQ6ZdCdy.png",
      "width": null,
      "height": null,
      "file_name": "5QvCRI3u...Q6ZdCdy.png",
      "file_size": null,
      "content_type": "image/png"
    }
  ],
  "description": "**Refining Subject Replacement**\n\nI'm focused on swapping the original subject with Dwight Schrute from another image, preserving the pose and background. The initial challenge is accurately isolating the target subject in the first image, and I am working on refining this aspect.\n\n\n\n**Analyzing Replacement Parameters**\n\nI'm now breaking down the tasks for replacing the subject. I'm prioritizing accurate pose matching and character appearance, aiming to seamlessly integrate Dwight into the existing scene while retaining the bedroom environment's integrity. I am also planning lighting adjustments.\n\n\n\n**Comparing and Assessing Results**\n\nI'm currently reviewing the output to ensure it aligns with the user's prompt. So far, the model has implemented every instruction. The character swap was successful, and I'm checking for accuracy in the character's appearance, pose and the background elements.\n\n\n\n**Validating the Output's Quality**\n\nI've examined the produced result in relation to the initial instructions. Dwight Schrute has replaced the original figure as requested, and the pose and background are as specified. I found the appearance of the figure is suitable, and the image fulfills all of the prompt's criteria. I am now confident that the output is appropriate.\n\n\n"
}
```

I want to use this new more refined prompt though:

```
Look at Image 1 (movie_frame.png, 1620x1080) and Image 2 (Dwight_Schrute.jpg, 265x375).

Image 1 is the SOURCE FRAME. Image 2 is the REPLACEMENT CHARACTER.

Your task: Replace the person/character in Image 1 with the character from Image 2.

RULES:
- OUTPUT DIMENSIONS: The final image MUST match the exact dimensions and aspect ratio of Image 1 (1620x1080). Image 2 is only a character reference — do not adopt its dimensions, aspect ratio, or framing in any way.
- The background, environment, lighting, and camera angle from Image 1 must remain completely unchanged.
- Match the exact pose, body position, and orientation of the person in Image 1.
- The replacement character must retain their own appearance fully — their face, hair, skin, clothing, accessories, and style as shown in Image 2. Do not transfer any visual traits from the Image 1 person onto the replacement character.
- Scale the replacement character naturally to fit the scene in Image 1.
- Maintain consistent lighting and shadows so the replacement character looks like they belong in the original scene.
- The final output should look like a single natural photograph or frame where the Image 2 character was always in that scene, in that pose.
```

I am pretty sure we can upload a file from a url to fal:

```
curl --request POST \
  --url https://api.fal.ai/v1/serverless/files/file/local/{target_path} \
  --header 'Authorization: <api-key>' \
  --header 'Content-Type: multipart/form-data' \
  --form 'file_upload=<unknown>'
```

We may or may not need to do this.

These requests take a long time so we will need to process their ID and stuff and probably poll it to get the output when it's done, vs just hanging and waiting for it. The fal-workflows.md file in this project should cover that.

I also have all other docs in here, nano banana 2 is technically newer than nano banana pro, i'd like to have the option for the user to select which image model they'd like to use for the image processing step. The user can also choose to regenerate the image if they don't like it since they can often come out incorrect, so between the steps of generating the first frame and generating the video we will need to ask the user for approval on the generated image.

There's an FFMPEG api on FAL we can use, the docs are in there as well. Please read all the other MD files. This prompt is available in PROMPT.md as well.

(The URLs have been truncated they don't actually have ... in them, this is an opensoruce project so I don't want to share the full URLs here, as you develop this and use CURL, etc. you will see the full URLs in the logs and stuff, but I have truncated them here for privacy)

You will find the FAL api key in the .env file (You have full permission to view the .env file I will roll the key after this dev session, .env is already in the .gitignore as well)

Please come up with a thoughrough plan as to how the backend flow will work for the user, upload assets > validate 10 second limit, validate mp4 format > take first frame via FAL ffmpeg API > create the image prompt > process the first frame with the selected image model > ask for user approval > allow for infinite regenerations of the image until they approve (including changing the model) > once approved submit the video generation job > get request/job ID > poll for results > return final video URL to user.

This is like the rough idea, but let me know if it makes sense. Or if we should change anything. Use ReactJS and Express and combine the projects into one monorepo that I can run from a single command. The React frontend will handle the user uploads and interactions, while the Express backend will handle all the FAL API interactions and processing logic. We can use a library like `axios` for making HTTP requests to the FAL API from the backend. Or regular fetch if that makes more sense.

I want to store all the job ids, everything (ig aside from photos and other things that don't need to be saved), inside of local storage for now. This means that once a job is started, it can be closed out of as long as the job id has been stored, and the page can be reopened by the user and they will get back the results from fal since it stores those output files for like 30 days or something. So we can just poll for the results with the job id and get the output when it's done, even if the user closes the page in between. This is important because these jobs can take a long time, especially the video generation step, so we don't want the user to have to keep the page open the entire time. We also want to make sure that if they do close the page, they can come back and see their results when they're done.

These generations can take like 15 mins sometimes so that's why we need to pay close attention to the fact that we need to make it so users can come back at any time even after closing the page during generation and it's rhobust enough to handle that and bring the results in.

And if a job fails we need to render that in the UI as well. We can use React Query or whatever the best libraries and techniques are for this, and we can use TailwindCSS and lucide icons as well. Or just use our own style sheet if we want. Up to you! Just as long as it works. Oh and make it so the user's FAL key is stored in localstorage as well, so they don't have to enter it every time. We can have a settings page where they can enter their FAL key and it will be saved in local storage for future use.
