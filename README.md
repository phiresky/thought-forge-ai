# thought-forge-ai

Generate 30-60 second "deep thought" TikTok-style video including a monologue, moving video scenes, music, and subtitles.

Examples: (make sure to turn on audio, GitHub mutes by default)

https://github.com/user-attachments/assets/a915af2d-d3a5-41a2-a76a-af2ac6f8b47d

https://github.com/user-attachments/assets/f32acff6-bdb6-43b0-9aac-cd5b993c19be

https://github.com/user-attachments/assets/6e1c8474-d115-46a0-acf7-71ca79fee551

Some more examples are in [./data/examples](./data/examples).

## Background / Motivation

I've recently seen a fair amount of "philosophical" and story-telling content on social media. Common traits are a calm voice, soothing music, calm pictures and a discussion of some topic of self-improvement, or love, or the world and our place in it. I enjoy this content which the algorithms have noticed.

Some of this type of content has clearly AI-generated elements, for example using the same voice or images that are slightly off. So I wondered how hard it would be to create similar content in a 100% automated manner. Turns out, it's pretty easy. It's also pretty hilarious to create thoughtful content about human struggles in modern life fully with AI.

## Quality and Future Work

Sometimes the quality is surprisingly good, both in the topic and structure as well as the video. Mostly it is somewhat mediocre.

I think the output could be improved a bit with better prompts, and significantly with more cherry-picking or using (human) source material or at least inspiration.

## Steps and Tools

This project uses a combination of tools together with custom written code:

| Step | Task                                                                         | Tool                                  | Cost per Video           | Free Alternative                            | Code                                     | Example                  |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------ | ------------------------------------------- | ---------------------------------------- | ------------------------ |
| 0    | Choose Topics, Voice and Clickbait Title                                     | LLM (Claude 3.5)                      | <$0.01[^1]               | Llama 3.1                                   | [step-00-find-topic.ts][s0src]           | [topic.json][s0eg]       |
| 1    | Write monologue script                                                       | LLM (Claude 3.5)                      | $0.01[^2]                | Llama 3.1                                   | [step-01-write-monologue.ts][s1src]      | [monologue.txt][s1eg]    |
| 2    | Read monologue                                                               | TTS (Elevenlabs)                      | $0.20[^3]                | [coqui-ai](https://github.com/coqui-ai/TTS) | [step-02-text-to-speech.ts][s2src]       | [speech.mp3][s2eg]       |
| 3    | Split monologue into scenes, create image prompts, calculate start+end times | LLM (Claude 3.5)                      | $0.01                    | Llama 3.1                                   | [step-03-text-to-image-prompt.ts][s3src] | [alignments.json][s3eg]  |
| 4    | Create starting image for each scene                                         | Text to Image (Flux.1 Pro)            | $0.35[^4]                | self-hosted Flux.1 Dev                      | [step-04-text-to-image.ts][s4src]        | [example.jpg][s4eg]      |
| 5    | Create scene video                                                           | Image to Video (RunwayML Gen-3 Alpha) | 1x$6.00 or $80/month[^5] | ?                                           | [step-05-image-to-video.ts][s5src]       | [example.mp4][s5eg]      |
| 6    | Create music prompt                                                          | LLM (Claude 3.5)                      | $0.01                    | Llama 3.1                                   | [step-06-text-to-music-prompt.ts][s6src] | [music-prompt.txt][s6eg] |
| 7    | Create music from prompt                                                     | Text to Audio (MusicGen)              | $0.17[^6]                | MusicGen self-hosted                        | [step-07-music.ts][s7src]                | [music.mp3][s7eg]        |
| 8    | Create subtitles for burn in                                                 | None                                  | $0                       | -                                           | [step-08-subtitles.ts][s8src]            | [subtitles.ass][s8eg]    |
| 9    | Merge and cut video, normalize loudness and merge audio, burn in subtitles   | ffmpeg                                | $0                       | -                                           | [step-09-ffmpeg.ts](s9src)               | [merged.mp4][s9eg]       |

Apart from the video generation the whole process is pretty cheap ($0.7 per video). The video generation is both the most enticing part and also the worst (wrt API and quality). I assume this will change in the coming months.

[s0src]: ./src/step-00-find-topic.ts
[s1src]: ./src/step-01-write-monologue.ts
[s2src]: ./src/step-02-text-to-speech.ts
[s3src]: ./src/step-03-text-to-image-prompt.ts
[s4src]: ./src/step-04-text-to-image.ts
[s5src]: ./src/step-05-image-to-video.ts
[s6src]: ./src/step-06-text-to-music-prompt.ts
[s7src]: ./src/step-07-music.ts
[s8src]: ./src/step-08-subtitles.ts
[s9src]: ./src/step-09-ffmpeg.ts
[s0eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/topic.json
[s1eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/monologue.txt
[s2eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/speech.mp3
[s3eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/alignments.json
[s4eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/0.00-6.235-img.jpg
[s5eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/0.00-6.235-vid.mp4
[s6eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/music-prompt.txt
[s7eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/music.mp3
[s8eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/subtitles.ass
[s9eg]: ./data/examples/002%20Why%20Being%20'Weak'%20Is%20Actually%20Your%20Greatest%20Strength/merged.mp4

[^1]: 1200 input tokens \* 3$/million + 2000 output tokens \* 3$/million = $0.03 for 10 videos
[^2]: 3000 tokens \* 3$/million + 200 tokens \* 15$/million
[^3]: around $20 for 100 minutes worth of tokens
[^4]: $0.05 per image, ~7 images per video
[^5]: 100 credits for 10 seconds of video, $1 for 100 credits. For 60 seconds $6. Unlimited generation for $80/month.
[^6]: on replicate.com around 2min of one A100 80GB at $5/hour makes ~$0.17
