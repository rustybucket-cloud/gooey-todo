import React, { useState, useReducer } from "react";
import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";
import { strikethrough } from "@opentui/core";
import type { Todo } from "../../services/todos";
import CurrentWeekProvider, {
  useCurrentWeek,
} from "./providers/current-week-provider";
import TodosProvider, { useTodos } from "./providers/todos-provider";

function getCurrentDayIndex(
  dates: Record<string, string>,
  dateIndices: Record<string, number>,
): number {
  const today = new Date().toISOString().substring(0, 10);

  // Check if today matches any of the week dates
  for (const [, dateValue] of Object.entries(dates)) {
    if (dateValue === today) {
      return dateIndices[dateValue] || 1;
    }
  }

  // Default to Monday if today is not in the current week
  return dateIndices[dates.monday!] || 1;
}

type Weekday = string;

type Focus = {
  date: number;
  row: number;
  lastWeekday?: number;
};

type ACTIONS =
  | "MOVE_DOWN"
  | "MOVE_UP"
  | "MOVE_RIGHT"
  | "MOVE_LEFT"
  | "JUMP_TO_SOMEDAY"
  | "JUMP_FROM_SOMEDAY";

function reducer(
  state: Focus,
  action: {
    type: ACTIONS;
    todos?: Record<string, Todo[]>;
    datesByIndex?: Record<number, string>;
  },
) {
  const todosByDay: Record<string, Todo[]> = action.todos || {};
  const datesByIndex = action.datesByIndex || {};
  const currentDateString = datesByIndex[state.date] || "";
  const currentTodos = todosByDay[currentDateString] || [];

  switch (action.type) {
    case "MOVE_DOWN":
      if (state.row >= currentTodos.length) {
        // If at bottom of Saturday, move to Sunday input row
        if (state.date === 6) {
          return { date: 0, row: 0, lastWeekday: state.date };
        }
        // If at bottom of any other weekday (1-5, 0), move to someday
        if ((state.date >= 1 && state.date <= 5) || state.date === 0) {
          return { date: 7, row: 0, lastWeekday: state.date };
        }
        return state;
      }
      return { ...state, row: state.row + 1 };
    case "MOVE_UP":
      // If in someday (index 7) and at input row (0), go back to last weekday
      if (state.date === 7 && state.row === 0) {
        const lastWeekday = state.lastWeekday ?? 1; // default to Monday
        const lastWeekdayString = datesByIndex[lastWeekday] || "";
        const lastWeekdayTodos = todosByDay[lastWeekdayString] || [];
        return {
          date: lastWeekday,
          row: Math.max(lastWeekdayTodos.length, 0),
          lastWeekday: lastWeekday,
        };
      }
      // If in Sunday and at input row (0), move to Saturday bottom
      if (state.date === 0 && state.row === 0) {
        const saturdayTodos = todosByDay[datesByIndex[6] || ""] || [];
        return {
          date: 6, // Saturday
          row: Math.max(saturdayTodos.length, 0),
          lastWeekday: 6,
        };
      }
      if (state.row === 0) return state;
      return { ...state, row: state.row - 1 };
    case "MOVE_RIGHT":
      // Top row (Mon-Fri): 1->2->3->4->5, then 5->6 (Sat)
      if (state.date >= 1 && state.date <= 4) {
        // Mon-Thu
        const nextDateString = datesByIndex[state.date + 1] || "";
        const nextTodos = todosByDay[nextDateString] || [];
        const maxRow = Math.max(0, nextTodos.length);
        return {
          ...state,
          date: state.date + 1,
          row: Math.min(state.row, maxRow),
          lastWeekday: state.date + 1,
        };
      }
      if (state.date === 5) {
        // Fri -> Sat
        const nextTodos = todosByDay[datesByIndex[6] || ""] || [];
        const maxRow = Math.max(0, nextTodos.length);
        return {
          ...state,
          date: 6, // Saturday
          row: Math.min(state.row, maxRow),
          lastWeekday: 6,
        };
      }
      if (state.date === 6) {
        // Sat -> Sun
        const nextTodos = todosByDay[datesByIndex[0] || ""] || [];
        const maxRow = Math.max(0, nextTodos.length);
        return {
          ...state,
          date: 0, // Sunday
          row: Math.min(state.row, maxRow),
          lastWeekday: 0,
        };
      }
      return state; // Sun, Someday can't go right
    case "MOVE_LEFT":
      // Top row (Mon-Fri): 5->4->3->2->1
      if (state.date >= 2 && state.date <= 5) {
        // Tue-Fri
        const prevDateString = datesByIndex[state.date - 1] || "";
        const prevTodos = todosByDay[prevDateString] || [];
        const maxPrevRow = Math.max(0, prevTodos.length);
        return {
          ...state,
          date: state.date - 1,
          row: Math.min(state.row, maxPrevRow),
          lastWeekday: state.date - 1,
        };
      }
      if (state.date === 0) {
        // Sun -> Sat
        const prevTodos = todosByDay[datesByIndex[6] || ""] || [];
        const maxPrevRow = Math.max(0, prevTodos.length);
        return {
          ...state,
          date: 6, // Saturday
          row: Math.min(state.row, maxPrevRow),
          lastWeekday: 6,
        };
      }
      if (state.date === 6) {
        // Sat -> Fri
        const prevTodos = todosByDay[datesByIndex[5] || ""] || [];
        const maxPrevRow = Math.max(0, prevTodos.length);
        return {
          ...state,
          date: 5, // Friday
          row: Math.min(state.row, maxPrevRow),
          lastWeekday: 5,
        };
      }
      return state; // Mon, Someday can't go left
    case "JUMP_TO_SOMEDAY":
      if (state.date === 7) return state; // already in someday
      return { ...state, date: 7, lastWeekday: state.date };
    case "JUMP_FROM_SOMEDAY":
      if (state.date !== 7) return state; // not in someday
      const targetWeekday = state.lastWeekday ?? 1; // default to Monday
      const targetDateString = datesByIndex[targetWeekday] || "";
      const targetTodos = todosByDay[targetDateString] || [];
      return {
        date: targetWeekday,
        row: Math.min(state.row, Math.max(targetTodos.length, 0)),
        lastWeekday: targetWeekday,
      };
    default:
      return state;
  }
}

export function Week() {
  return (
    <CurrentWeekProvider>
      <WeekContent />
    </CurrentWeekProvider>
  );
}

function WeekContent() {
  const { currentWeek } = useCurrentWeek();

  return (
    <TodosProvider
      weekStart={currentWeek.weekStart}
      weekEnd={currentWeek.weekEnd}
    >
      <WeekView />
    </TodosProvider>
  );
}

function WeekView() {
  const { dates, dateIndices, datesByIndex } = useCurrentWeek();
  const { todosByDay, addTodoForDate, toggleTodoComplete, deleteTodoById } =
    useTodos();

  const [focused, dispatch] = useReducer(reducer, {
    date: getCurrentDayIndex(dates, dateIndices),
    row: 0,
  });

  const isInputFocused = focused.row === 0;

  const renderer = useRenderer();

  useKeyboard((key) => {
    if (["down", "j"].includes(key.name)) {
      if (key.name === "j" && isInputFocused) return;
      if (key.shift) {
        dispatch({ type: "JUMP_TO_SOMEDAY", todos: todosByDay, datesByIndex });
        return;
      }
      dispatch({ type: "MOVE_DOWN", todos: todosByDay, datesByIndex });
    } else if (["up", "k"].includes(key.name)) {
      if (key.name === "k" && isInputFocused) return;
      if (key.shift) {
        dispatch({
          type: "JUMP_FROM_SOMEDAY",
          todos: todosByDay,
          datesByIndex,
        });
        return;
      }
      dispatch({ type: "MOVE_UP", todos: todosByDay, datesByIndex });
    }

    if (["right", "l"].includes(key.name)) {
      if (key.name === "l" && isInputFocused) return;
      dispatch({ type: "MOVE_RIGHT", todos: todosByDay, datesByIndex });
    }

    if (["left", "h"].includes(key.name)) {
      if (key.name === "h" && isInputFocused) return;
      dispatch({ type: "MOVE_LEFT", todos: todosByDay, datesByIndex });
    }

    if (isInputFocused) return;

    if (key.name === "t") {
      renderer.toggleDebugOverlay();
    }

    if (key.name === "c") {
      const currentDateString = datesByIndex[focused.date] || "";
      const currentTodos = todosByDay[currentDateString] || [];
      const todoIndex = focused.row - 1;

      if (todoIndex >= 0 && todoIndex < currentTodos.length) {
        const todoToToggle = currentTodos[todoIndex];
        if (todoToToggle?.id) {
          toggleTodoComplete(todoToToggle.id);
        }
      }
    }

    if (key.name === "d") {
      const currentDateString = datesByIndex[focused.date] || "";
      const currentTodos = todosByDay[currentDateString] || [];
      const todoIndex = focused.row - 1;

      if (todoIndex >= 0 && todoIndex < currentTodos.length) {
        const todoToDelete = currentTodos[todoIndex];
        if (todoToDelete?.id) {
          deleteTodoById(todoToDelete.id);
        }
      }
      dispatch({ type: "MOVE_UP", todos: todosByDay, datesByIndex });
    }
  });

  const isSelected = ({ date, row }: { date: Weekday; row: number }) => {
    return focused.date === dateIndices[date] && focused.row === row;
  };

  const addTodo = (todo: Omit<Todo, "id">) => {
    if (todo.assignedDate) {
      addTodoForDate(todo.assignedDate, todo.text);
    }
  };

  return (
    <group padding={1}>
      <text fg="#00FF00">Todoui!</text>
      <group style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Day
          isSelected={isSelected}
          date={dates.monday}
          todos={todosByDay[dates.monday] ?? []}
          addTodo={addTodo}
          weekdayName="Monday"
        />
        <Day
          isSelected={isSelected}
          date={dates.tuesday}
          todos={todosByDay[dates.tuesday] ?? []}
          addTodo={addTodo}
          weekdayName="Tuesday"
        />
        <Day
          isSelected={isSelected}
          date={dates.wednesday}
          todos={todosByDay[dates.wednesday] ?? []}
          addTodo={addTodo}
          weekdayName="Wednesday"
        />
        <Day
          isSelected={isSelected}
          date={dates.thursday}
          todos={todosByDay[dates.thursday] ?? []}
          addTodo={addTodo}
          weekdayName="Thursday"
        />
        <Day
          isSelected={isSelected}
          date={dates.friday}
          todos={todosByDay[dates.friday] ?? []}
          addTodo={addTodo}
          weekdayName="Friday"
        />
        <group style={{ flexDirection: "column" }}>
          <Day
            isSelected={isSelected}
            date={dates.saturday}
            todos={todosByDay[dates.saturday] ?? []}
            addTodo={addTodo}
            weekdayName="Saturday"
          />
          <Day
            isSelected={isSelected}
            date={dates.sunday}
            todos={todosByDay[dates.sunday] ?? []}
            addTodo={addTodo}
            weekdayName="Sunday"
          />
        </group>
      </group>
      <Day
        isSelected={isSelected}
        date={dates.someday}
        todos={todosByDay[dates.someday] ?? []}
        addTodo={addTodo}
        weekdayName="Someday"
      />
      <text fg="#888888">
        ←→hjkl: navigate | shift+↓: someday | shift+↑: from someday | c:
        complete | d: delete | t: debug
      </text>
    </group>
  );
}

function Day({
  isSelected,
  date,
  todos,
  addTodo,
  weekdayName,
}: {
  isSelected: ({ date, row }: { date: string; row: number }) => boolean;
  date: string;
  todos: Todo[];
  addTodo: (todo: Omit<Todo, "id">) => void;
  weekdayName: string;
}) {
  const { height, width } = useTerminalDimensions();
  const rootPadding = 2;
  const headingHeight = 1;
  const dayHeadingHeight = 6;
  const verticalGap = 1;
  const dayHeight =
    height / 2 - rootPadding - dayHeadingHeight - headingHeight - verticalGap;

  const boxWidth = width / 6 - rootPadding;

  // Get the correct date for this specific day
  const getDateForDay = () => {
    if (date === "someday") return "";
    // Parse the ISO date string and add 'T00:00:00' to ensure it's treated as local time
    return new Intl.DateTimeFormat("en-us", {
      month: "short",
      day: "numeric",
    }).format(new Date(date + "T00:00:00"));
  };

  return (
    <box
      style={{ width: weekdayName !== "Someday" ? boxWidth : "100%" }}
      border
      borderColor="#FFFFFF"
      borderStyle="rounded"
    >
      <group style={{ flexDirection: "column", height: dayHeight }}>
        <box border={["bottom"]} borderColor="#FFFFFF">
          <group
            style={{ justifyContent: "space-between", flexDirection: "row" }}
          >
            {weekdayName !== "Someday" ? (
              <text fg="#FFFFFF">{getDateForDay()}</text>
            ) : null}
            <text>
              {weekdayName === "Someday"
                ? weekdayName
                : weekdayName.slice(0, 3)}
            </text>
          </group>
        </box>
        <box
          backgroundColor={isSelected({ date, row: 0 }) ? "#FFFFFF" : "#424242"}
        >
          <TodoInput
            addTodo={addTodo}
            focused={isSelected({ date, row: 0 })}
            date={date}
          />
        </box>
        {/* for some reason, the first box overlaps the input box */}
        {/* so we add an empty box to push the other boxes down */}
        <box>
          <text />
        </box>
        {todos.map((todo, index) => (
          <box
            key={index}
            backgroundColor={
              isSelected({ date, row: index + 1 }) ? "#FFFFFF" : "#000000"
            }
          >
            <text
              fg={isSelected({ date, row: index + 1 }) ? "#000000" : "#FFFFFF"}
            >
              {todo.completedAt ? strikethrough(todo.text) : todo.text}
            </text>
          </box>
        ))}
      </group>
    </box>
  );
}

function TodoInput({
  addTodo,
  focused,
  date,
}: {
  addTodo: (todo: Omit<Todo, "id">) => void;
  focused: boolean;
  date: string;
}) {
  const [input, setInput] = useState("");

  return (
    <box title="Add Todo">
      <input
        placeholder="Add Todo"
        value={input}
        onInput={setInput}
        focused={focused}
        onSubmit={() => {
          if (input.trim() === "") return;
          addTodo({
            text: input,
            completedAt: null,
            assignedDate: date,
            createdAt: new Date().toISOString(),
          });
          setInput("");
        }}
      />
    </box>
  );
}
