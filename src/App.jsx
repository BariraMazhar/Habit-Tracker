import { useEffect, useMemo, useReducer, useState } from "react";
import "./index.css";

const STORAGE_KEY = "habit-tracker:v1";

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function formatDay(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getWeekLabel(weekStart) {
  const end = addDays(weekStart, 6);
  return `${formatDate(weekStart)} - ${formatDate(end)}`;
}

function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function calculateStreak(completions) {
  const completedDates = Object.keys(completions || {})
    .filter((key) => completions[key])
    .sort();

  if (completedDates.length === 0) return 0;

  let cursor = new Date(completedDates[completedDates.length - 1]);
  let streak = 0;

  while (completions[toDateKey(cursor)]) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

const initialState = {
  habits: [],
};

function createHabit(name) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completions: {},
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "RESTORE":
      return action.payload;

    case "ADD_HABIT":
      return {
        ...state,
        habits: [createHabit(action.name), ...state.habits],
      };

    case "RENAME_HABIT":
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id
            ? {
                ...habit,
                name: action.name.trim(),
                updatedAt: new Date().toISOString(),
              }
            : habit
        ),
      };

    case "DELETE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.id),
      };

    case "TOGGLE_COMPLETION":
      return {
        ...state,
        habits: state.habits.map((habit) => {
          if (habit.id !== action.id) return habit;

          const nextCompletions = { ...habit.completions };

          if (nextCompletions[action.dateKey]) {
            delete nextCompletions[action.dateKey];
          } else {
            nextCompletions[action.dateKey] = true;
          }

          return {
            ...habit,
            completions: nextCompletions,
            updatedAt: new Date().toISOString(),
          };
        }),
      };

    default:
      return state;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.habits)) {
      return initialState;
    }

    return parsed;
  } catch {
    return initialState;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [habitName, setHabitName] = useState("");
  const today = new Date();

  useEffect(() => {
    dispatch({ type: "RESTORE", payload: loadState() });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const completionStats = useMemo(() => {
    const total = state.habits.length * 7;
    const done = state.habits.reduce((sum, habit) => {
      return (
        sum +
        weekDays.filter((day) => habit.completions[toDateKey(day)]).length
      );
    }, 0);

    return { done, total };
  }, [state.habits, weekDays]);

  function handleAddHabit(e) {
    e.preventDefault();

    if (!habitName.trim()) return;

    dispatch({ type: "ADD_HABIT", name: habitName });
    setHabitName("");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-cyan-300">
              Weekly Habit Tracker
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Build consistency, one week at a time.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Track daily habits, review previous weeks, and keep your streaks
              visible without losing historical progress.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 shadow-xl">
            <p className="text-sm text-slate-400">This week</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {completionStats.done}
              <span className="text-base text-slate-500">
                /{completionStats.total || 0}
              </span>
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form
              onSubmit={handleAddHabit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="habit">
                Habit name
              </label>
              <input
                id="habit"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="Add a habit, e.g. Read 20 minutes"
                className="min-h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 sm:w-80"
              />
              <button
                type="submit"
                className="min-h-11 rounded-2xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
              >
                Add Habit
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
              >
                Previous week
              </button>

              <button
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
              >
                Current week
              </button>

              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
              >
                Next week
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {getWeekLabel(weekStart)}
              </h2>
              <p className="text-sm text-slate-400">
                Monday to Sunday tracking view
              </p>
            </div>
          </div>
        </section>

        {state.habits.length === 0 ? (
          <EmptyState />
        ) : (
          <HabitGrid
            habits={state.habits}
            weekDays={weekDays}
            today={today}
            dispatch={dispatch}
          />
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-cyan-400/10 text-3xl">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-white">
        Start building your rhythm
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
        Add your first habit to create a weekly tracking grid. Your progress
        will persist across reloads and previous weeks.
      </p>
    </section>
  );
}

function HabitGrid({ habits, weekDays, today, dispatch }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[260px_repeat(7,1fr)_120px] border-b border-slate-800 bg-slate-950/60">
            <div className="sticky left-0 z-20 bg-slate-950/95 px-5 py-4 text-sm font-semibold text-slate-300">
              Daily Habit
            </div>

            {weekDays.map((day) => {
              const todayColumn = isSameDay(day, today);

              return (
                <div
                  key={toDateKey(day)}
                  className={`px-3 py-4 text-center ${
                    todayColumn ? "bg-cyan-400/10" : ""
                  }`}
                >
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${
                      todayColumn ? "text-cyan-200" : "text-slate-500"
                    }`}
                  >
                    {todayColumn ? "Today" : formatDay(day)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      todayColumn ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {formatDate(day)}
                  </p>
                </div>
              );
            })}

            <div className="px-5 py-4 text-right text-sm font-semibold text-slate-300">
              Streak
            </div>
          </div>

          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              weekDays={weekDays}
              today={today}
              dispatch={dispatch}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HabitRow({ habit, weekDays, today, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(habit.name);
  const streak = calculateStreak(habit.completions);

  function saveRename() {
    if (!draftName.trim()) {
      setDraftName(habit.name);
      setEditing(false);
      return;
    }

    dispatch({
      type: "RENAME_HABIT",
      id: habit.id,
      name: draftName,
    });

    setEditing(false);
  }

  return (
    <div className="grid grid-cols-[260px_repeat(7,1fr)_120px] border-b border-slate-800 last:border-b-0">
      <div className="sticky left-0 z-10 flex min-h-16 items-center gap-3 bg-slate-900 px-5">
        {editing ? (
          <input
            value={draftName}
            autoFocus
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") {
                setDraftName(habit.name);
                setEditing(false);
              }
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
          />
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{habit.name}</p>
              <p className="text-xs text-slate-500">Daily habit</p>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label={`Rename ${habit.name}`}
            >
              Edit
            </button>

            <button
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete "${habit.name}"? This removes its history.`
                );

                if (confirmed) {
                  dispatch({ type: "DELETE_HABIT", id: habit.id });
                }
              }}
              className="rounded-lg px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-400"
              aria-label={`Delete ${habit.name}`}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {weekDays.map((day) => {
        const key = toDateKey(day);
        const completed = Boolean(habit.completions[key]);
        const todayColumn = isSameDay(day, today);

        return (
          <div
            key={key}
            className={`grid min-h-16 place-items-center px-3 ${
              todayColumn ? "bg-cyan-400/10" : ""
            }`}
          >
            <button
              onClick={() =>
                dispatch({
                  type: "TOGGLE_COMPLETION",
                  id: habit.id,
                  dateKey: key,
                })
              }
              aria-pressed={completed}
              aria-label={`${completed ? "Mark incomplete" : "Mark complete"} ${
                habit.name
              } for ${formatDay(day)}, ${formatDate(day)}`}
              className={`grid h-10 w-10 place-items-center rounded-2xl border text-sm font-bold transition duration-150 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 ${
                completed
                  ? "scale-105 border-cyan-300 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                  : "border-slate-700 bg-slate-950 text-transparent hover:border-cyan-400 hover:bg-slate-800"
              }`}
            >
              ✓
            </button>
          </div>
        );
      })}

      <div className="flex min-h-16 items-center justify-end px-5">
        <span
          aria-label={`${streak} day streak for ${habit.name}`}
          className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-200"
        >
          🔥 {streak}
        </span>
      </div>
    </div>
  );
}

export default App;