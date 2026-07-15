"use client";

import { useState, useEffect } from "react";

export function useTypewriter(text: string, speed = 35, instant = false): string {
  const [displayed, setDisplayed] = useState(instant ? text : "");

  useEffect(() => {
    if (instant) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let index = 0;
    let id: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (index >= text.length) return;
      index++;
      setDisplayed(text.slice(0, index));
      id = setTimeout(tick, speed);
    };

    id = setTimeout(tick, speed);
    return () => clearTimeout(id);
  }, [text, speed, instant]);

  return displayed;
}
