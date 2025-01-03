\header {
  title="Peace and quiet!"
  composer="Victor the best composer"
  tagline="Wasn't that a relaxing eight seconds?"
}

\version "2.12.0"

sop =  \transpose c c'{
	\voiceOne
	\ottava #0
	b\longa\rest
	b\breve\rest b\breve\rest
	b1\rest b1\rest b1\rest b1\rest
	b2\rest b2\rest b2\rest b2\rest b2\rest b2\rest b2\rest b2\rest
	\break \bar "||"
	b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest b4\rest
	b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest
	\break \bar "||"
	b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest
	\break \bar "||"
	b\breve.\rest b1\rest
	b\breve..\rest b2\rest
	b\breve...\rest b4\rest
	b\breve....\rest b8\rest
	b\breve.....\rest b16\rest
	b\breve......\rest b32\rest
	b\breve.......\rest b64\rest
	b\breve........\rest b128\rest
	\break \bar "||"
	b\longa\rest
	\bar "|."
}

tenor = {
	\voiceTwo
	\ottava #0
	d\longa\rest
	d\breve\rest d\breve\rest
	d1\rest d1\rest d1\rest d1\rest
	d2\rest d2\rest d2\rest d2\rest d2\rest d2\rest d2\rest d2\rest
	\break \bar "||"
	d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest d4\rest
	d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest
	\break \bar "||"
	d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest
	\break \bar "||"
	d\breve.\rest d1\rest
	d\breve..\rest d2\rest
	d\breve...\rest d4\rest
	d\breve....\rest d8\rest
	d\breve.....\rest d16\rest
	d\breve......\rest d32\rest
	d\breve.......\rest d64\rest
	d\breve........\rest d128\rest
	\break \bar "||"
	d\longa\rest
	\bar "|."
}

global = {
	\time 4/1
	\tempo 4=1920
	#(set-accidental-style 'piano)
	\key c \major
}

upperStaff = \context Staff = upper<< 
	\global
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