# ANSWERS.md

## 1. How to run

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

---

## 2. Stack & design choices

I chose React with Vite because the project is highly interaction-focused and component-driven. React makes the weekly tracking grid easy to model with reusable UI components, while Vite provides a fast development environment with minimal configuration overhead.

Tailwind CSS is used to speed up iteration while maintaining a consistent spacing and typography system. The utility-first approach also made responsive refinement easier during implementation.

For interaction design, I intentionally treated the weekly grid as the primary product surface. Users naturally think about habits across time, so placing habits vertically and days horizontally improves scanability and pattern recognition.

I also highlighted the current day column using layered visual emphasis rather than color alone. This improves usability, accessibility, and orientation within the grid.

---

## 3. Responsive & accessibility reasoning

On smaller devices, compressing seven columns into narrow cells would reduce readability and touch accuracy. Instead, the grid becomes horizontally scrollable while maintaining comfortable tap targets and preserving layout clarity.

Accessibility considerations included:

* Keyboard-navigable controls
* ARIA labels for habit completion buttons
* Visible focus rings
* Semantic button elements instead of clickable divs
* High contrast interactive states
* Screen-reader-friendly labels

I also ensured that important UI states such as “today” and “completed” are communicated through both structure and color.

---

## 4. AI usage transparency

I used AI as a brainstorming and review assistant during architecture planning, UX refinement, accessibility review, and documentation writing.

I did not blindly copy generated code. Several outputs were refactored or simplified before implementation. For example, I intentionally avoided adding heavy state management libraries because the assessment scope did not require them.

AI was mainly used to:

* Explore architectural tradeoffs
* Improve accessibility considerations
* Refine UX wording
* Review edge cases
* Improve documentation quality

---

## 5. Honest gap analysis

One area that could be improved further is long-term analytics and progress visualization. The current implementation focuses on weekly tracking and streak visibility, but does not yet provide monthly trends or deeper reporting.

With additional time, I would also:

* Add drag-and-drop habit sorting
* Introduce integration tests
* Add cloud synchronization
* Improve offline/PWA support
* Add animation preference handling for reduced motion users

I prioritized stability, clarity, responsiveness, and accessibility over adding excessive feature complexity.
