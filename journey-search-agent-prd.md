# PRD: Journey Search Agent

**Status:** Draft  
**Author:** maxwell.cochrane@ontrackretail.co.uk  
**Date:** 2026-06-12  

---

## Abbreviations

| Abbreviation | Full Term | Description |
|---|---|---|
| PRD | Product Requirements Document | This document. Defines the feature scope, requirements, and success criteria. |
| NLP | Natural Language Processing | The AI technique used to extract structured data (stations, dates, passengers etc.) from free-form user input. |
| TTS | Text-to-Speech | Technology that converts the agent's text responses into spoken audio. |
| STT | Speech-to-Text | Technology that converts the user's spoken input into text for processing. |
| CTA | Call to Action | A UI element (button, prompt) that directs the user to take a specific action. |
| API | Application Programming Interface | The connection layer between the app and external services (e.g. the LLM provider, station data). |
| LLM | Large Language Model | The AI model (e.g. Claude Haiku, Gemini Flash) used to interpret user input and extract journey parameters. |
| JSON | JavaScript Object Notation | A structured data format used by the LLM to return extracted journey parameters to the app. |
| OS | Operating System | The device's native platform (iOS or Android), which provides built-in STT and TTS capabilities. |
| NPS | Net Promoter Score | A measure of user satisfaction and likelihood to recommend the product. |
| P0 | Priority 0 | Must-have requirement. The feature cannot ship without it. |
| P1 | Priority 1 | Nice-to-have. Improves the experience but not required for launch. |
| P2 | Priority 2 | Future consideration. Out of scope for v1 but worth designing for. |
| v1 / v2 | Version 1 / Version 2 | Release phases of the feature. |

---

## Problem Statement

The current journey search experience requires users to navigate a structured form — selecting stations, dates, times, passengers, and railcards across multiple steps. For users with accessibility needs, including those with visual impairments, motor difficulties, cognitive load challenges, or low digital literacy, this form-based interaction creates significant barriers to independent use of the app. Users who struggle with small touch targets, complex multi-step flows, or reading dense UI cannot easily complete a journey search without assistance.

The Journey Search Agent addresses this directly by replacing the form with a natural, conversational voice and text interface. Users can describe their journey as they would to another person, and the agent handles the structure on their behalf. This makes journey search accessible to a broader range of users, reduces reliance on assistance from others, and sets a foundation for voice-first interaction across the app.

---

## Goals

1. Improve accessibility — provide an alternative to form-based search that users with visual impairments, motor difficulties, cognitive load challenges, or low digital literacy can use independently.
2. Reduce the time from home screen to journey results for users who know their journey.
3. Establish a credible, on-brand AI/voice entry point that builds confidence in AI features for future iterations.
4. Successfully complete a journey search for at least the minimum required parameters without the user needing to touch a traditional form field.
5. Achieve high task completion — users who open the agent reach the results page without abandoning.
6. Handle natural language input (including vague time references, partial station names, and implied journey types) reliably enough that users trust the output.
7. Build the baseline voice and NLP infrastructure that future conversational features can extend — including but not limited to Delay Repay claims and Refund requests.

---

## Non-Goals

- **Full conversational AI / general assistant**: The agent is scoped exclusively to journey search. It will not answer questions about the app, provide travel advice, or handle any other intent. This scope keeps the first AI feature safe and reliable.
- **Always-listening / wake word activation**: The agent is tap-to-activate only. Ambient listening introduces platform complexity and privacy risk not warranted for v1.
- **Saving or replaying past conversations**: Chat history is not persisted. Back from results returns to the open chat state, not a transcript.
- **Branding / persona naming**: The agent is labelled "Travel Agent" functionally. Naming and brand personality are deferred to a later design pass.

---

## User Stories

### Primary user — traveller who knows their journey

- As a traveller, I want to describe my journey in plain English so that I can get to results faster than filling out a form.
- As a traveller, I want to speak my journey rather than type it so that I can search hands-free.
- As a traveller, I want the agent to infer my journey type (single vs return) from what I say so that I don't need to explicitly select it.
- As a traveller, I want to see a summary of what the agent understood before it searches so that I can catch any mistakes before I see results.
- As a traveller, I want to tap any field on the summary and correct it by voice so that fixing errors feels as natural as the original input.
- As a traveller, I want to return to the agent from results and refine my search so that I don't have to start from scratch if the results aren't right.

### Secondary user — traveller who is uncertain or incomplete

- As a traveller who hasn't decided their return time, I want the agent to ask me rather than assume so that I don't land on wrong results.
- As a traveller who doesn't know the exact station name, I want the agent to show me closest matches so that I can pick the right one.
- As a traveller who mentions a railcard, I want the agent to apply it automatically so that I don't need to find a railcard field separately.

---

## Requirements

### Must-Have (P0)

**Home screen entry point**
- A persistent component on the home screen presents a fake search bar with the prompt "Where are you going?" and a branded mic CTA labelled "Travel Agent".
- Tapping anywhere on the component opens the Journey Search Agent screen.

**Chat interface**
- The screen provides a text input, a tap-to-speak mic button, and a mute button.
- The mic button activates OS-level speech-to-text on tap; a second tap (or automatic silence detection) stops recording and submits the transcription.
- The user can switch freely between typing and speaking at any point in the conversation.
- The agent speaks its responses and questions aloud using TTS (text-to-speech). All agent messages are voiced as well as displayed.
- A mute button is persistently visible in the chat interface. Tapping it toggles TTS off; the agent continues to display messages as text but stops speaking. The mute state persists for the duration of the session.
- When muted, a clear visual indicator confirms the bot is muted (e.g. a crossed-out speaker icon).

**Free-form NLP extraction**
- The agent extracts all provided journey parameters from a single free-form input where possible. It does not ask for parameters the user has already given.
- Extracted parameters: origin station, destination station, outbound date/time, inbound date/time (return only), journey type (single/return), passenger counts and types, railcards, via station.

**Defaults and inference rules**

> ⚠️ **Note:** The rules below are indicative suggestions based on initial design thinking. Final rulesets, keyword triggers, and edge case handling will be scoped out fully during the design and discovery phase before implementation.


| Condition | Behaviour |
|---|---|
| No passengers specified | Default to 1 adult |
| No railcard mentioned | Default to no railcard |
| No via station mentioned | Default to no via |
| **Time / date** | |
| User says "now", "next", "fastest", "ASAP", "earliest" | Set outbound to current time; infer single |
| User says "morning" | Set time to 07:30 |
| User says "afternoon" | Set time to 13:00 |
| User says "lunchtime" | Set time to 12:00 |
| User says "evening" or "tonight" | Set time to 19:00 |
| User says "tomorrow morning/afternoon/evening" | Set date to tomorrow + corresponding time |
| User says "this weekend" | Set outbound to coming Saturday; ask for time |
| User says "next week" | Insufficient — ask for specific day |
| User says "rush hour" | Ambiguous — ask whether they mean morning (08:00) or evening (17:30) |
| **Journey type** | |
| User says "returning", "coming back", "there and back" | Infer return journey |
| User says "day trip" | Infer return; set outbound and ask for return time same day |
| **Passengers** | |
| User says "just me" | 1 adult |
| User says "me and my partner / wife / husband / friend" | 2 adults |
| User says "me and my kids" | 1 adult; ask how many children and their ages |
| User mentions "a baby" | Clarify — lap infant requires no seat; ask to confirm |
| **Railcards** | |
| User says "I have a railcard" without specifying type | Ask which railcard |
| User says "senior" or "OAP" | Apply Senior Railcard |
| User says "student" | Apply 16–25 Railcard (confirm if ambiguous) |
| **Station ambiguity** | |
| User says "London" as origin or destination | Ask which London terminal, or default to most common for the destination corridor |
| Two or more stations share the same name | Always show options; never auto-resolve |

**Minimum required before search**
- Origin station, destination station, and outbound date/time are always required.
- For return journeys: inbound date is additionally required (time will be asked if not provided; morning/afternoon/evening accepted).
- The agent will not submit a search until minimum requirements are met; it asks only for the missing required fields.

**Station resolution**
- Station names are matched using fuzzy search against the full station list.
- The closest match is selected automatically when confidence is high.
- When no confident match exists, the agent presents a short inline list of closest matches for the user to select from.

**Guardrailing**
- If the user says something outside journey search scope, the agent responds with a soft redirect (e.g. "I'm here to help you find train journeys — where would you like to go?") and does not process the off-topic input.

**Summary screen**
- Before executing the search, the agent transitions to a full summary screen showing all parameters as discrete editable fields.
- Each field is tappable and opens a voice input control scoped to that field (e.g. tapping Origin opens a voice/text input for station only).
- A clear CTA ("Search journeys") submits to the results page.

**Results handoff and back navigation**
- Tapping Search navigates to the standard journey results page populated with the extracted parameters.
- Pressing back from results returns the user to the Journey Search Agent screen with the chat in an open/ready state, not cleared.

### Nice-to-Have (P1)

- **Contextual smart defaults from location**: If device location is available, bias station fuzzy matching toward stations near the user's current position.
- **Previous search recall**: On returning from results, pre-populate the input with a readable summary of the last search so the user can make a quick verbal correction ("change return to Sunday evening").
- **Passenger shorthand**: Recognise "family of 4" or "two adults and a kid" style phrasing without requiring explicit adult/child counts.
- **Railcard fuzzy matching**: Accept common shorthand (e.g. "network card", "16-25") and resolve to the correct railcard type.
- **Animated mic state**: Visual feedback (waveform or pulsing ring) while speech is being recorded.

### Future Considerations (P2)

- **Wake word / ambient activation**: "Hey [agent name], find me a train to…"
- **Multi-modal result preview**: A journey card preview shown inline in the chat before navigating to full results.
- **Persona naming and brand voice**: Named travel assistant with a defined conversational tone.
- **Journey history**: The agent surfaces recently searched or saved journeys as quick-start options.

---

## Conversation Flow

```
User opens agent
    ↓
Agent prompt: "Where are you going?"
    ↓
User speaks or types (free-form)
    ↓
Agent extracts all available parameters
    ↓
Missing required fields? ──Yes──→ Agent asks for missing field(s) only
    ↓ No                                         ↓
    ←────────────────────────────────────────────┘
All required fields satisfied
    ↓
Summary screen shown (all fields, each tappable to edit by voice)
    ↓
User confirms → Journey results
    ↓
User presses back → Agent screen (open/ready state)
```

---

## Edge Cases and Error Handling

| Scenario | Behaviour |
|---|---|
| Station not found / no confident match | Show inline list of closest matches; user taps to select |
| Return journey, date given but no time | Ask for time; accept morning / afternoon / evening |
| User goes off-topic | Soft redirect: "I'm here to help you find train journeys — where would you like to go?" |
| Speech-to-text fails or returns empty | Show error inline: "I didn't catch that — try typing or tap the mic again." |
| Both origin and destination are the same station | Surface an inline validation message before allowing search |
| Outbound time is in the past | Allow search (user may want historical pricing or is aware); no error unless outbound is >24h in the past (consider flagging) |

---

## Success Metrics

### Leading indicators (days to weeks post-launch)

| Metric | Target |
|---|---|
| Agent open rate (% home screen sessions that open the agent) | ≥ 15% within 30 days |
| Task completion rate (% of agent opens that reach results) | ≥ 70% |
| Zero-clarification rate (% of searches where minimum info provided in first message) | ≥ 40% |
| Summary edit rate (% of summaries where user edits at least one field) | Baseline only — informs NLP accuracy |
| Speech input usage (% of agent interactions that use mic at least once) | Baseline only |

### Lagging indicators (weeks to months post-launch)

| Metric | Target |
|---|---|
| Repeat agent usage (% of users who use it more than once in 30 days) | ≥ 50% of agent users |
| Agent vs form search split | Track trend — not a hard target for v1 |
| NPS delta for users who use the agent vs those who don't | Positive, measured at 60 days |

---

## Open Questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| 1 | What NLP/intent extraction layer is used — on-device, a hosted model, or a rules-based keyword extractor? This affects latency, cost, and offline behaviour. | Engineering | Yes |
| 2 | How is the station list sourced and how often is it updated? Fuzzy matching accuracy depends on data quality. | Engineering / Data | Yes |
| 3 | What is the fallback if speech-to-text is unavailable (e.g. no mic permission, offline)? | Engineering | Yes |
| 4 | Are there any analytics or data retention implications for storing voice/text input? | Legal / Data | Yes |
| 8 | Which TTS provider/engine will be used, and what are the latency and cost implications? On-device (e.g. AVSpeechSynthesizer / Android TTS) is free but lower quality; cloud TTS (e.g. ElevenLabs, Google TTS) is higher quality but adds cost and latency. | Engineering | Yes |
| 9 | Should mute state persist across sessions (user preference), or reset each time the agent is opened? | Product | No |
| 5 | What is the maximum number of passengers the agent should accept? | Product | No |
| 6 | Should the agent support group/party booking edge cases (e.g. "me and 9 colleagues")? | Product | No |
| 7 | Do we need to handle split ticketing or is that explicitly out of scope? | Product | No |

---

## Timeline Considerations

- This is the **first AI/voice surface in the app** — engineering will need to establish the NLP integration pattern, which may have lead time beyond the feature itself.
- Station fuzzy matching needs to be validated against the full station list before launch; poor accuracy will undermine trust in the feature.
- Suggested phasing:
  - **Phase 1**: Text input only, NLP extraction, summary screen, results handoff. TTS responses included from the start — voice output is core to the conversational experience, not an add-on.
  - **Phase 2**: Voice input (tap-to-speak) + mute button, mic CTA on home screen entry point.
  - **Phase 3**: P1 improvements (location bias, previous search recall, animated mic state).
