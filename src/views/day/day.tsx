import { useState, useReducer } from "react";
import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";
import { strikethrough } from "@opentui/core";
import type { Todo } from "../../services/todos";
import CurrentDayProvider, { useCurrentDay } from "./providers/current-day-provider";
import DayTodosProvider, { useDayTodos } from "./providers/day-todos-provider";
import { HelpDialog } from "../week/help-dialog";
import { useRouter } from "../../contexts/router-context";

type Focus = {
  row: number;
};

type ACTIONS = "MOVE_DOWN" | "MOVE_UP";

function reducer(
  state: Focus,
  action: {
    type: ACTIONS;
    todos?: Todo[];
  },
) {
  const todos = action.todos || [];

  switch (action.type) {
    case "MOVE_DOWN":
      if (state.row >= todos.length) {
        return state;
      }
      return { row: state.row + 1 };
    case "MOVE_UP":
      if (state.row === 1) return state;
      return { row: state.row - 1 };
    default:
      return state;
  }
}

export function Day() {
  return (
    <CurrentDayProvider>
      <DayContent />
    </CurrentDayProvider>
  );
}

function DayContent() {
  const { currentDay } = useCurrentDay();
  const { selectedDate } = useRouter();

  // Use the selected date from router if available, otherwise use current day
  const dateToShow = selectedDate || currentDay.dateString;

  return (
    <DayTodosProvider date={dateToShow}>
      <DayView />
    </DayTodosProvider>
  );
}

function TodoDialog({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");

  return (
    <box
      style={{
        position: "absolute",
        top: 5,
        left: 10,
        right: 10,
        zIndex: 1000,
      }}
      border
      borderColor="#4A90E2"
      borderStyle="rounded"
      backgroundColor="#000000"
      padding={2}
    >
      <group style={{ flexDirection: "column" }}>
        <text fg="#4A90E2">Add Todo</text>
        <input
          placeholder="Enter todo text..."
          value={input}
          onInput={setInput}
          focused={true}
          onSubmit={() => {
            if (input.trim() === "") return;
            onSubmit(input.trim());
          }}
        />
        <text></text>
        <text fg="#888888">Press Enter to add, Esc to cancel</text>
      </group>
    </box>
  );
}

function ConfirmDeleteDialog({
  todoText,
  onConfirm,
  onCancel,
}: {
  todoText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useKeyboard((key) => {
    if (key.name === "enter" || key.name === "return") {
      onConfirm();
    } else if (key.name === "escape") {
      onCancel();
    }
  });

  return (
    <box
      style={{
        position: "absolute",
        top: 5,
        left: 10,
        right: 10,
        zIndex: 1000,
      }}
      border
      borderColor="#FF6B6B"
      borderStyle="rounded"
      backgroundColor="#000000"
      padding={2}
    >
      <group style={{ flexDirection: "column" }}>
        <text fg="#FF6B6B">Delete Todo</text>
        <text></text>
        <text fg="#FFFFFF">Are you sure you want to delete:</text>
        <text fg="#FFEB3B">"{todoText}"</text>
        <text></text>
        <text fg="#888888">Press Enter to confirm, Esc to cancel</text>
      </group>
    </box>
  );
}

function DayView() {
  const { currentDay, goToNextDay, goToPreviousDay } = useCurrentDay();
  const { todos, addTodo, toggleTodoComplete, deleteTodoById } = useDayTodos();
  const { goToWeekView, selectedDate } = useRouter();

  // Use the selected date from router if available, otherwise use current day
  const displayDate = selectedDate ? new Date(selectedDate + "T00:00:00") : currentDay.date;

  const [focused, dispatch] = useReducer(reducer, {
    row: 1,
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showTodoDialog, setShowTodoDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null,
  );

  const renderer = useRenderer();

  useKeyboard((key) => {
    // Don't handle navigation when todo dialog or delete confirmation is open
    if (showTodoDialog || deleteConfirmation) {
      if (key.name === "escape") {
        setShowTodoDialog(false);
        setDeleteConfirmation(null);
      }
      return;
    }

    if (["down", "j"].includes(key.name)) {
      dispatch({ type: "MOVE_DOWN", todos });
    } else if (["up", "k"].includes(key.name)) {
      dispatch({ type: "MOVE_UP", todos });
    }

    if (["right", "l"].includes(key.name)) {
      if (key.shift) {
        goToNextDay();
        return;
      }
    }

    if (["left", "h"].includes(key.name)) {
      if (key.shift) {
        goToPreviousDay();
        return;
      }
    }

    if (key.name === "t") {
      renderer.toggleDebugOverlay();
    }

    if (key.name === "a") {
      setShowTodoDialog(true);
    }

    if (key.name === "c") {
      const todoIndex = focused.row - 1;

      if (todoIndex >= 0 && todoIndex < todos.length) {
        const todoToToggle = todos[todoIndex];
        if (todoToToggle?.id) {
          toggleTodoComplete(todoToToggle.id);
        }
      }
    }

    if (key.name === "d") {
      const todoIndex = focused.row - 1;

      if (todoIndex >= 0 && todoIndex < todos.length) {
        const todoToDelete = todos[todoIndex];
        if (todoToDelete?.id) {
          setDeleteConfirmation(todoToDelete.id);
        }
      }
    }

    if (key.name === "?") {
      setShowHelp((prev) => !prev);
    }

    if (key.name === "escape") {
      setShowHelp(false);
      setShowTodoDialog(false);
      setDeleteConfirmation(null);
    }

    // Key to go back to week view
    if (key.name === "w") {
      goToWeekView();
    }
  });

  const formatDate = () => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(displayDate);
  };

  const { height } = useTerminalDimensions();

  return (
    <group padding={1}>
      <group style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg="#4A90E2">Gooey Todo! - Day View</text>
        <text fg="#FFFFFF">{formatDate()}</text>
      </group>
      
      <box
        border
        borderColor="#4A90E2"
        borderStyle="rounded"
        style={{ height: height - 8 }}
      >
        <group style={{ flexDirection: "column", padding: 1 }}>
          <text fg="#FFFFFF" style={{ marginBottom: 1 }}>Today's Todos</text>
          {todos.map((todo, index) => (
            <box
              key={todo.id}
              backgroundColor={
                focused.row === index + 1 ? "#FFFFFF" : "#000000"
              }
              style={{ padding: "0 1" }}
            >
              <text
                fg={focused.row === index + 1 ? "#000000" : "#FFFFFF"}
              >
                {todo.completedAt ? strikethrough(todo.text) : todo.text}
              </text>
            </box>
          ))}
          {todos.length === 0 && (
            <text fg="#888888" style={{ padding: "0 1" }}>
              No todos for today. Press 'a' to add one!
            </text>
          )}
        </group>
      </box>
      
      <text fg="#888888">
        ↑↓jk: navigate | shift+←→: prev/next day | a: add todo | c: complete | d: delete | w: week view | ?: help
      </text>
      
      {showHelp && <HelpDialog />}
      {showTodoDialog && (
        <TodoDialog
          onSubmit={(text: string) => {
            addTodo(text);
            setShowTodoDialog(false);
          }}
          onClose={() => setShowTodoDialog(false)}
        />
      )}
      {deleteConfirmation &&
        (() => {
          const todoToDelete = todos.find((todo) => todo.id === deleteConfirmation);

          return todoToDelete ? (
            <ConfirmDeleteDialog
              todoText={todoToDelete.text}
              onConfirm={() => {
                deleteTodoById(deleteConfirmation);
                setDeleteConfirmation(null);
                dispatch({ type: "MOVE_UP", todos });
              }}
              onCancel={() => setDeleteConfirmation(null)}
            />
          ) : null;
        })()}
    </group>
  );
}