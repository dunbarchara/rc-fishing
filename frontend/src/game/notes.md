# Game loop

IDLE → (click to cast) → WAITING → (random delay) → BITE!

    BITE! → (click within ~1s) → REELING → CATCH → IDLE
                                           fetch('/api/catch')
    BITE! → (too slow)         → ESCAPED → IDLE

# rhythm

beat:     1    2    3    4  | 5    6    7    8  | 9    10   11   12
waiting:  ·    ·    ·    ·  | ·    ·    ·    ·  |
bite:                         TUG  TUG  (you)(you)
