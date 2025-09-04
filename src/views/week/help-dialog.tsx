import React from "react";

export function HelpDialog() {
  return (
    <box
      style={{
        position: "absolute",
        top: 2,
        left: 2,
        right: 2,
        bottom: 2,
        zIndex: 1000,
      }}
      border
      borderColor="#00FF00"
      borderStyle="rounded"
      backgroundColor="#000000"
      padding={2}
    >
      <group style={{ flexDirection: "column" }}>
        <text fg="#00FF00">Help - Keyboard Shortcuts</text>

        <group style={{ flexDirection: "column" }}>
          <text fg="#FFFFFF">Navigation:</text>
          <text fg="#888888"> ↑↓ or k/j Move up/down</text>
          <text fg="#888888"> ←→ or h/l Move left/right</text>
          <text fg="#888888"> Shift+↓ Jump to Someday</text>
          <text fg="#888888"> Shift+↑ Jump from Someday</text>
          <text fg="#888888"> Shift+←→ Previous/Next week</text>

          <text fg="#FFFFFF">Actions:</text>
          <text fg="#888888"> a Add new todo (when on a day)</text>
          <text fg="#888888"> c Complete/uncomplete todo</text>
          <text fg="#888888"> d Delete todo</text>

          <text fg="#FFFFFF">Other:</text>
          <text fg="#888888"> t Toggle debug overlay</text>
          <text fg="#888888"> ? or Shift+/ Show this help</text>
          <text fg="#888888"> Esc Close help</text>
        </group>

        <text fg="#888888">Press Esc or ? to close</text>
      </group>
    </box>
  );
}
