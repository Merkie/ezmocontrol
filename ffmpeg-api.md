# Ffmpeg Api

> ffmpeg endpoint for first, middle and last frame extraction from videos


## Overview

- **Endpoint**: `https://fal.run/fal-ai/ffmpeg-api/extract-frame`
- **Model ID**: `fal-ai/ffmpeg-api/extract-frame`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: utility, editing



## Pricing

- **Price**: $0.0002 per seconds

For more details, see [fal.ai pricing](https://fal.ai/pricing).

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`video_url`** (`string`, _required_):
  URL of the video file to use as the video track
  - Examples: "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4"

- **`frame_type`** (`FrameTypeEnum`, _optional_):
  Type of frame to extract: first, middle, or last frame of the video Default value: `"first"`
  - Default: `"first"`
  - Options: `"first"`, `"middle"`, `"last"`



**Required Parameters Example**:

```json
{
  "video_url": "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4"
}
```

**Full Example**:

```json
{
  "video_url": "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4",
  "frame_type": "first"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<Image>`, _required_)
  - Array of Image
  - Examples: [{"url":"https://v3.fal.media/files/elephant/IHmmk4dvyoCCYhtzI2FsO_16df6b1358374c1a9b023c80d752ee7b.jpg"}]



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/elephant/IHmmk4dvyoCCYhtzI2FsO_16df6b1358374c1a9b023c80d752ee7b.jpg"
    }
  ]
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/ffmpeg-api/extract-frame \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "video_url": "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4"
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/ffmpeg-api/extract-frame",
    arguments={
        "video_url": "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4"
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/ffmpeg-api/extract-frame", {
  input: {
    video_url: "https://v3.fal.media/files/monkey/R6D8anxtsyItZTyBB2ksC_qeoDDxmLSg8cuWasM54KY_output.mp4"
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


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/ffmpeg-api/extract-frame)
- [API Documentation](https://fal.ai/models/fal-ai/ffmpeg-api/extract-frame/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/ffmpeg-api/extract-frame)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)
