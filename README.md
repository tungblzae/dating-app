# Clique Dating – Mini App Prototype

A single-page dating app prototype built with React. Users can create profiles, like each other, match, and schedule a date — all within the browser.

**Live demo:** _[https://dating-app-sand.vercel.app/]_  
**Tech stack:** React, localStorage (no backend)

---

## Getting Started

```bash
git clone https://github.com/tungblzae1nt/clique-dating
cd clique-dating
npm install
npm start
```

The app runs on `http://localhost:3000`.

To deploy:
```bash
npm run build


## How to Test the Full Flow

Because this is a prototype with no real authentication, you simulate multiple users by switching accounts via email.

1. **Create User A** — fill in the form, submit
2. **Create User B** — click "Đổi user" → "Tạo profile" to create a second account
3. **As User A** — go to Browse, like User B
4. **As User B** — go to Browse, like User A → match is triggered
5. **As User A** — go to Matches, click "Chọn lịch hẹn", add time slots, save
6. **As User B** — do the same → the app finds and displays the first overlapping slot

---

## Project Structure

Everything lives in a single file: `src/App.js`

App.js
├── store            – localStorage read/write helpers
├── generateId()     – creates unique IDs for profiles
├── getNext21Days()  – returns array of date strings for the scheduler
├── formatDate()     – formats ISO date to Vietnamese locale string
├── findFirstCommonSlot() – core scheduling algorithm
├── HeartBg          – decorative animated background component
├── ProfileCard      – renders a single user card with Like / Schedule buttons
├── ScheduleModal    – modal for selecting and comparing availability slots
└── App              – main component, holds all state and view routing
```

---

## How Data is Stored

All data is saved to `localStorage` under three keys:

| Key | Type | Contents |
|-----|------|----------|
| `profiles` | `Array` | All user profiles (id, name, age, gender, bio, email) |
| `likes` | `Object` | `{ userId: { targetId: true } }` — who liked whom |
| `schedules` | `Object` | `{ userId: { matchedId: [slots] } }` — availability per match pair |

Each piece of state is synced to localStorage via a `useEffect` that fires whenever that state changes:

```js
useEffect(() => { store.set("profiles", profiles); }, [profiles]);
```

Data persists across page reloads. To reset everything, clear localStorage in DevTools.

---

## Match Logic

A match occurs when **both users have liked each other**. This is checked with:

```js
likes[userA][userB] === true && likes[userB][userA] === true
```

In practice, this runs inside `getMatches(userId)`:

```js
function getMatches(userId) {
  const userLikes = likes[userId] || {};
  return profiles.filter(p =>
    p.id !== userId &&
    userLikes[p.id] &&         // current user liked them
    (likes[p.id] || {})[userId] // they liked current user back
  );
}
```

When a like is submitted, the app immediately checks if the target has already liked back — if yes, a "It's a Match!" toast is shown.

---

## Slot Overlap Algorithm

`findFirstCommonSlot(slotsA, slotsB)` loops through every pair of slots from User A and User B. For each pair on the same date, it checks if the time ranges overlap by converting `"HH:MM"` strings to integers (e.g. `"09:30"` → `930`) and comparing:

```js
const overlapStart = Math.max(aStart, bStart);
const overlapEnd   = Math.min(aEnd, bEnd);
if (overlapEnd > overlapStart) → overlap found
```

It returns the **first** overlapping slot it finds (A's slot order takes priority). If no overlap exists across all pairs, it returns `null` and prompts both users to re-select.

Example:
```
User A: 2026-03-01, 09:00 → 12:00
User B: 2026-03-01, 11:00 → 14:00
Result: 2026-03-01, 11:00 → 12:00 ✅
```

---

## Form Validation

The profile creation form validates before saving:

- **Name** — must not be empty
- **Age** — must be a number between 18 and 99
- **Email** — must match a basic email regex pattern
- **Duplicate email** — if the email already exists in `profiles`, an error is shown and no new profile is created

Errors are stored in an `errors` object and displayed inline below each field.

---

## What I'd Improve With More Time

- **Real backend** — replace localStorage with a database (e.g. Supabase or Firebase) so matches persist across devices and multiple users can interact in real time
- **Proper authentication** — currently "login" is just matching an email to a stored profile; a real app would need passwords or OAuth
- **Un-like / unmatch** — there's currently no way to undo a like
- **Better time conflict UX** — when no slot overlaps, show which slots came closest so users know what to adjust
- **Mobile layout** — the grid works but the schedule modal needs responsive polish on small screens

---

## Feature Suggestions for the Real Product

**1. Icebreaker prompts on match**  
Instead of jumping straight to scheduling, prompt matched users with a fun question (e.g. "What's your ideal first date?"). This increases message response rates and makes the scheduling feel less transactional.

**2. Availability recurring patterns**  
Let users set recurring availability (e.g. "every Saturday morning") instead of picking dates one by one each time they match. Reduces friction for active users with multiple matches.

**3. Match expiry**  
If neither user schedules a date within 7 days of matching, the match expires with a gentle nudge notification. This creates urgency and keeps engagement high — a pattern used effectively by Bumble.
