# thought-forge-ai

Generate 30-60 second "deep thought" TikTok-style video including a monologue, moving video scenes, music, and subtitles.

Examples:

https://github.com/user-attachments/assets/5a3b9845-bc43-4748-b551-fc1ae69e4cab

https://github.com/user-attachments/assets/6e1c8474-d115-46a0-acf7-71ca79fee551

Some more examples are in [./data/examples](./data/examples).

## Background

I've recently seen a fair amount of "philosophical" and story-telling content on social media. Common traits are a calm voice, soothing music, calm pictures and a discussion of some topic of self-improvement, or love, or the world and our place in it. I enjoy this content which the algorithms have noticed.

Some of this type of content has clearly AI-generated elements, for example using the same voice or images that are slightly off. So I wondered how hard it would be to create similar content in a 100% automated manner. Turns out, it's pretty easy. It's also pretty hilarious to create thoughtful content about human struggles in modern life fully with AI.

## Quality and Future Work

Sometimes the quality is surprisingly good, both in the topic and structure as well as the video. Mostly it is somewhat mediocre.

I think the output could be improved a bit with better prompts, and significantly with more cherry-picking or using (human) source material or at least inspiration.

## Tools

This project uses a combination of tools:

| Task                                                                         | Tool                                  | Cost per Video           | Free Alternative                            | Code                                     | Example              |
| ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------ | ------------------------------------------- | ---------------------------------------- | -------------------- |
| Choose Topics, Voice and Clickbait Title                                     | LLM (Claude 3.5)                      | <$0.01[^1]               | Llama 3.1                                   | [step-00-find-topic.ts][s0src]           | [example.json][s0eg] |
| Write monologue script                                                       | LLM (Claude 3.5)                      | $0.01[^2]                | Llama 3.1                                   | [step-01-write-monologue.ts][s1src]      | [example.txt][s1eg]  |
| Read monologue                                                               | TTS (Elevenlabs)                      | $0.20[^3]                | [coqui-ai](https://github.com/coqui-ai/TTS) | [step-02-text-to-speech.ts][s2src]       | [example.mp3][s2eg]  |
| Split monologue into scenes, create image prompts, calculate start+end times | LLM (Claude 3.5)                      | $0.01                    | Llama 3.1                                   | [step-03-text-to-image-prompt.ts][s3src] | [example.json][s3eg] |
| Create starting image for each scene                                         | Text to Image (Flux.1 Pro)            | $0.35[^4]                | self-hosted Flux.1 Dev                      | [step-04-text-to-image.ts][s4src]        | [example.jpg][s4eg]  |
| Create scene video                                                           | Image to Video (RunwayML Gen-3 Alpha) | 1x$6.00 or $80/month[^5] | ?                                           | [step-05-image-to-video.ts][s5src]       | [example.mp4][s5eg]  |
| Create music prompt                                                          | LLM (Claude 3.5)                      | $0.01 $                  | Llama 3.1                                   | [step-06-text-to-music-prompt.ts][s6src] | [example.txt][s6eg]  |
| Text to Audio (MusicGen)                                                     | $0.17[^6]                             | MusicGen self-hosted     | [step-06]                                   | [step-07-music.ts][s7src]                | [example.mp3][s7eg]  |

[s0src]: ./src/step-00-find-topic.ts
[s1src]: ./src/step-01-write-monologue.ts
[s2src]: ./src/step-02-text-to-speech.ts
[s3src]: ./src/step-03-text-to-image-prompt.ts
[s4src]: ./src/step-04-text-to-image.ts
[s5src]: ./src/step-05-image-to-video.ts
[s6src]: ./src/step-06-text-to-music-prompt.ts
[s7src]: ./src/step-07-music.ts
[s8src]: ./src/step-08-ffmpeg.ts
[s9src]: ./src/step-09-subtitles.ts
[s0eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/topic.json
[s1eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/monologue.txt
[s2eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/speech.mp3
[s3eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/alignments.json
[s4eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/0.00-6.235-img.jpg
[s5eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/0.00-6.235-vid.mp4
[s6eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/music-prompt.txt
[s7eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/music.mp3
[s8eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/merged.mp4
[s9eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/subtitles.ass

[^1]: 1200 input tokens \* 3$/million + 2000 output tokens \* 3$/million = $0.03 for 10 videos
[^2]: 3000 tokens \* 3$/million + 200 tokens \* 15$/million
[^3]: around $20 for 100 minutes worth of tokens
[^4]: $0.05 per image, ~7 images per video
[^5]: 100 credits for 10 seconds of video, $1 for 100 credits. For 60 seconds $6. Unlimited generation for $80/month.
[^6]: on replicate.com around 2min of one A100 80GB at $5/hour makes ~$0.17
