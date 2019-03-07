\header {
  title="LOL (out of range!)"
  composer="Victor the best composer"
  tagline="I bet you cannot play this on an 88-key piano; it's only five seconds long!"
}

\version "2.12.0"

upperoutofrange = { < eeses'''' d'''' cisis'''' > 1 ~ }
loweroutofrange = { < fisis,,,, g,,,, aeses,,,, > 1 ~ }

urs = { \upperoutofrange \upperoutofrange \upperoutofrange \upperoutofrange \upperoutofrange \upperoutofrange \upperoutofrange \upperoutofrange }

sop =  \transpose c c'{
	\voiceOne
	\ottava #2
	\set Staff.keySignature = #`((0 . ,DOUBLE-SHARP)
                               (1 . ,NATURAL)
                               (2 . ,DOUBLE-FLAT))
	\urs \break
	\bar "||"
	\key cisis \major
	\urs \break
	\bar "||"
	\key ceses \major
	\urs \break
	\bar "||"
	\key c \major
	\urs \break
	\bar "||"
	\urs
	\bar "|."
}

lrs = { \loweroutofrange \loweroutofrange \loweroutofrange \loweroutofrange \loweroutofrange \loweroutofrange \loweroutofrange \loweroutofrange }

tenor = {
	\voiceTwo
	\ottava #-2
	\set Staff.keySignature = #`((3 . ,DOUBLE-SHARP)
                               (4 . ,NATURAL)
                               (5 . ,DOUBLE-FLAT))
	\lrs \break
	\bar "||"
	\key ceses \major
	\lrs \break
	\bar "||"
	\key cisis \major
	\lrs \break
	\bar "||"
	\key c \major
	\lrs \break
	\bar "||"
	\lrs
	\bar "|."
}

global = {
	\override Staff.TimeSignature #'style = #'neomensural
	\time 2/2
	\tempo 1=480
	#(set-accidental-style 'piano)
}

upperStaff = \context Staff = upper<< 
	\global
	s1*0 \sustainOn
	\clef "G"
	  <<
	   \context Voice = "upper" \sop
	  >>
>>

lowerStaff = \context Staff = lower<<
	\global
	\clef "F"
	<<
	    \context Voice = "lower" \tenor
	>>
>>
\score{
 %\transpose bes c'
	<<
		\upperStaff
		\lowerStaff
	>>

	\layout {
	  indent = 0.0\mm
	}

	\midi {
	}
}