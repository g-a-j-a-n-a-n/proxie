# Original-plan compliance review

Review date: **2026-11-12**. Basis: the user-supplied **Proxie: Build Plan** (`attached_assets/PLAN_1794458462798.md` in the original workspace) and later decisions requiring private accounts, a development-only shared judge demo, a honeycomb skill map, and readable pseudocode.

This is a code-and-test evidence report, not a claim that every requirement has passed live browser acceptance. Original attachments are not student/demo content and are not included as runtime data.

**Status meanings:** “Implemented” means matching backend/UI code is present. “Tested” names actual checks. “Partial” identifies a simplification or gap. “Not verified” means no corresponding end-to-end evidence from this review.

| Plan area | Evidence/status | Limits or remaining verification |
| --- | --- | --- |
| PDF/transcript → notebook | Implemented: upload/paste/saved-source UI, extraction, grouped generation, persistence, notebook route | Live provider generation and PDF upload were not exercised in this review to avoid charges and unnecessary data changes. |
| Compile saved materials on demand | Implemented: selected source IDs are resolved from the current student's sources | Foreign-source access is tested; live compilation success is not browser-verified here. |
| Private accounts | Implemented: Clerk identity, per-student workspaces, private routes and file ownership | Isolation suite passed using fictional injected identities. Real Clerk browser sign-in/switching is separate pending coverage. |
| Shared judge access | Implemented only in development, with fictional seed material | Not a production login or a substitute for private accounts; shared edits are visible to other judges. |
| Public example workspace | Later user-approved addition: private temporary practice copies available without sign-up in production | Separate from the legacy shared judge account. Sample edits, citations, quizzes and honeycomb progress work without allowing uploads or paid AI calls. See `EXAMPLE-WORKSPACE.md`. |
| Cited summary, points, terms, visuals | Implemented: structured validation and exact normalized source-quote matching; invalid items dropped | Quote existence does not establish semantic entailment. No automatic proof that every generated interpretation is true. |
| Citation opens source | Implemented: source dialog and authenticated PDF route | Foreign files/IDs rejected in isolation tests; actual PDF viewer interaction is not browser-verified here. |
| Visible disclaimer | Implemented near notebook top | Labels generated notes as a study aid and student edits as not AI-verified. |
| Flag sentence/section and edit/regenerate | Implemented in notebook UI and API; flag stores selected text, section, citation and note | Isolation attempts are tested. Detailed citation-preservation/fix-history regressions are existing separate work, not claimed complete here. |
| Flags/fixes in run diagram | Implemented: Flag, Edit/Regenerate, Save events | Replay of a live edited notebook is not browser-verified in this review. |
| Consent/no live recording | Implemented permission checkbox/server check; no recording feature | Users remain responsible for authorization; no reference creator's notes are seeded as demo content. |
| Input limits and unreadable/scanned PDFs | Implemented processing checks and error messages; 15 MiB, 100 pages, 120,000 combined characters | No OCR. Storage ingress is not capped by the extraction limit. Full malformed/encrypted/scanned failure regression suite is separate work. |
| Retry once and labeled fallback | Implemented per source group: timeout, one retry, source-excerpt fallback and events | Fallback can have no generated questions/terms/diagrams. Live timeout/retry was not deliberately induced. |
| Malformed output/unmatched citation handling | Implemented item validation, dropping and result counts | Broader deterministic generation tests exist as separate work, not merged evidence here. |
| Run statuses/durations/results | Implemented and persisted | Events measure bounded steps; runs are in-process, not a durable worker queue. |
| Data model | Logical entities represented in per-student JSONB workspace documents; PDFs stored privately outside DB | Physical schema differs from the plan's proposed normalized tables; users are managed by Clerk; fixes are stored with flags. |
| Course setup from syllabus/slides | Implemented: syllabus setup and topics from notebook sections | Slide-derived topic names use generated section titles, not guaranteed verbatim slide headings. |
| Rename/merge/remove topics and edit links | Implemented course dialogs/API; graph cycle rejection | Detailed graph/progress regressions are separate work. |
| Honeycomb skill tree | Integrated with real API levels, citations, review actions and topic edits | Individual prerequisite routes are listed in detail but tier arrows are not yet exact per-topic connectors; an existing task covers this. |
| Levels and spaced review | Implemented: 3 qualifying correct sessions, ≥20-hour spacing, source-backed questions; predecessor Practicing/Mastered unlocks next topic | Quiz quality still depends on generation. Three sessions is an implementation choice, not proof of real mastery. |
| Long-gap decay | Partial: workspace display lowers Mastered to Practicing after >30 days unless paused | Not a fully persisted/adaptive decay model, and detail responses may not apply the same display transform. |
| Placement check | Implemented short diagnostic, up to 2 questions/topic and 12 total | Full placement-route regression coverage remains separate work. |
| “This week” quests | Partial: next available/weak topics in syllabus order | No actual lecture calendar or next-lecture date input; not date-scheduled weekly planning. |
| Badges, streaks, pause | Implemented milestones and pause/resume state | These are study signals, not credentials; detailed time-based tests are separate work. |
| XP for understanding | Implemented difficulty/spaced-answer scoring and repeated-question window | Evidence anti-farming logic is code-reviewed here, not exhaustively proven. |
| Honest progress labels | Implemented answer-count labels and non-grade language | Keep these labels in every future visualization. |
| Replay speed | Implemented 0.5× / 1× / 2× in run diagram | Only replay is delayed, not real processing. |
| Notebook visual style | Implemented paper/grid, readable body + handwritten headings, highlights, callouts, source diagrams, flip terms | Charts/diagrams remain optional when no source support exists. |
| Pseudocode | Implemented fenced/recognized blocks, line layout, source-preserving inferred formatting | Parser/layout tests passed; old PDFs with lost geometry cannot recover exact indentation reliably. |
| Phone layout | Responsive code and prior homepage/notebook screenshots exist | Comprehensive signed-in notebook/diagram/honeycomb phone testing is not complete; an existing task covers honeycomb extremes. |
| Publish/republish and private-window test | Not performed by this task | Export is not deployment. Requires deliberate production configuration, spend review and live checks. |

## Acceptance boundaries

Course setup, quizzes/levels and the skill tree remain core, as the original plan requires. They were not removed to reduce costs.

This review does **not** certify complete plan compliance. In particular: live browser/provider testing, calendar-based weekly quests, exact prerequisite connectors, consistent/persisted decay, and production publish verification remain gaps or separate work. Preserve private source access, honest citations, and error labels when addressing them.
