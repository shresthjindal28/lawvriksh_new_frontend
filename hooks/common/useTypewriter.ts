import { useState, useEffect } from 'react';

export function useTypewriter(
  words: string[],
  typingSpeed: number = 100,
  deletingSpeed: number = 50,
  pauseTime: number = 2000
) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeedState, setTypingSpeedState] = useState(typingSpeed);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setText(
        isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1)
      );

      setTypingSpeedState(isDeleting ? deletingSpeed : typingSpeed);

      if (!isDeleting && text === fullText) {
        setTypingSpeedState(pauseTime);
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeedState(500); // Small pause before typing new word
      }
    };

    timer = setTimeout(handleTyping, typingSpeedState);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, words, typingSpeed, deletingSpeed, pauseTime, typingSpeedState]);

  return text;
}
